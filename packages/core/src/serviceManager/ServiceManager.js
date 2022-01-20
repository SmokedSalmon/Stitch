import configManager from '../configManager'
import { RouterService } from '../services'
import { systemServices } from '../services/constants'
import {
  SERVICE_TYPE_SYSTEM,
  SERVICE_TYPE_LIB,
  SERVICE_TYPE_CUSTOMIZED,
  SERVICE_AUTOLOAD
} from './constants'
import { globalState, log } from '../utils'
import { SERVICE_STATUS, ROUTER_SERVICE, MAX_SERVICE_DEPENDENCY_DEPTH } from '../constants'
import { createHostContext } from '../HostContext'
import { loadScriptAsync } from '../utils/loadModule'

/**
 * @typedef {MessageService | StyleService} SystemService
 */

/**
 * Filter services by object parameter
 * @param {ManagedServiceConfig} serviceConfig - given service's config
 * @param {ManagedServiceConfig} params - parameter object for desired service
 * @return {boolean}
 */
function filterServiceByParams (serviceConfig, params = {}) {
  const keys = Object.keys(params).filter(key => Object.hasOwnProperty.call(params, key))
  return keys.every(property => serviceConfig[property] === params[property])
}

/**
 * Filter services by an enumerator function, which takes a variable as the passed-in service definition/config
 * @param {ManagedServiceConfig} serviceConfig
 * @param {function(ManagedServiceConfig):boolean} func
 * @return {boolean}
 */
function filterServiceByFunc (serviceConfig, func) {
  if (!func || typeof func !== 'function') return false
  if (func.length < 1) {
    throw new TypeError('To filter service with function, an enumerator function at least one variable to take a service definition/config must be provided')
  }
  return func(serviceConfig)
}

/**
 * @typedef {Object} ServiceMeta
 * Please see definition @ https://alm-confluence.systems.uk.hsbc/confluence/display/CIDCS/06.+ServiceManager
 * @property {string} name - Service name
 * @property {string} type - Origin type of the service. 'System' or 'Customized' or 'Lib'
 * @property {string} [libName] - Only available when type is 'Lib'
 * @property {boolean} [autoLoad] - Should load it before application life cycle? Only available when type is 'Lib'
 * @property {boolean} [disabled]
 * @property {boolean} protected - The protected indicator defined in config
 */

class ServiceManager {
  #state
  #serviceCache
  #serviceMetas
  #servicesWithError
  #atomicServiceSequence
  #serviceStartNode
  #logger = log.getLogger('ServiceManager')

  constructor () {
    this.#state = globalState
    this.#serviceCache = {}
    this.#serviceMetas = {}
    this.#servicesWithError = new Set()

    Object.freeze(this)
  }

  /**
   * Assign and register Service Meta, which is converted from system Config, with missing property supplemented with defined in config
   * @param {string} name
   */
  #syncConfigToServiceMeta (name) {
    const serviceConfig = configManager.getServiceConfig(name)
    // Disabled/error/corrupted service is excluded
    if (!serviceConfig || this.#servicesWithError.has(name) || serviceConfig.disabled) {
      delete this.#serviceMetas[name]
      return
    }

    // The service is required for the first time, we will load it
    const {
      type, libName,
      autoLoad, disabled, protected: isProtected // avoid `'protected' is reserved syntax error`
    } = serviceConfig
    // system service is ALWAYS protected
    const shouldProtect = type === SERVICE_TYPE_SYSTEM ? true : (isProtected || false)

    /** @type {ServiceMeta} **/
    const meta = {
      name,
      type,
      libName,
      autoLoad,
      disabled,
      protected: shouldProtect
    }

    Object.freeze(meta)
    this.#serviceMetas[name] = meta
  }

  /**
   * Read config at real time and sync all service metas
   */
  #syncConfigToServiceMetas () {
    Object.values(configManager.getServiceConfig()).forEach(serviceConfig => {
      this.#syncConfigToServiceMeta(serviceConfig.name)
    })
  }

  /**
   * Register a getService cache result
   * @param {string} name
   * @param {MFEService} instance
   */
  #registerService (name, instance) {
    if (!instance.start || !instance.stop || !instance.getStatus || !instance.createClient) {
      this.#logger.warn(`Can not find all life cycle functions in service: '${name}'`, 'SM-P-3001')
    }

    this.#serviceCache[name] = instance
  }

  /**
   * Load the service defined in MFE Lib. Return a Promise with delayed success or fail result.
   * After the Lib service is loaded, could use getService to query and consume it.
   * @param {string} name
   * @return {Promise.<Object.<LibService>>}
   */
  #loadLibService (name) {
    const serviceConfig = configManager.getServiceConfig(name)
    const { libName, libUrl } = serviceConfig
    return loadScriptAsync(libUrl, libName, name)
      .then(() => {
        return window[libName]
        // 'services' module, defined in remote module's webpack config - ModuleFederationPlugin plugin's library.name
          .get('services')
          .then(module => module().default.getService(name))
          .catch(err => {
            this.#logger.error(`Cannot find service '${name} in module '${libName}' @ '${libUrl}'`, 'SM-N-4001')
            throw err
          })
      })
  }

  /**
   * Circular dependency check and notify user if detected
   * @param {string} item
   * @param {Set.<string>} [ancestors] - Parent services of this service in hierarchy order
   * @param {boolean} [vocal] - true to enable log
   * @return {boolean}
   */
  #checkCircularDependency (item, ancestors = new Set(), vocal = true) {
    if (ancestors.has(item)) {
      const parent = [...ancestors].pop()
      if (vocal) {
        this.#logger.warn(`Circular dependencies detected, ${item} is required by ${parent} that is also ${item}'s sub-service`, 'SM-P-3002.1')
        this.#logger.warn(`Dependency chain: ${[...ancestors, item].join(' -> ')}`, 'SM-P-3002.2')
        this.#logger.warn(`${item} status will be excluded from dependencies of ${parent}, ${parent} will load and start regardless of ${item}`, 'SM-P-3002.3')
      }
      return true
    }
    return false
  }

  /**
   * Address a single service node in the service dependency tree process recursively, breadth-first
   * If the service is NOT autoLoad and not loaded currently, it will load it via getService().
   * @param {string} serviceName
   * @param {Set.<string>} [ancestors] - Parent services of this service in hierarchy order
   * @return {*}
   */
  async #staticDependencyAnalysis (serviceName, ancestors = new Set()) {
    // If the same service is already in the dependency tree, use it to avoid duplicated start
    if (this.#serviceStartNode[serviceName]) return this.#serviceStartNode[serviceName]

    // Circular dependency check - if detected, it will resolve without start again, so that its parent will load & start despite its status
    if (this.#checkCircularDependency(serviceName, ancestors)) return Promise.resolve()

    // DO NOT use `getServiceSync` here, as some service in the dependency tree might not be autoLoaded
    const service = await this.getService(serviceName)
    if (!service) return Promise.resolve()
    const subRequireServices = service.require && service.require()

    /* Atomic service, there are no sub-services */
    if (!subRequireServices || !subRequireServices.length) return service

    /* Service that has other sub-services */
    // Dependency depth limit
    if (ancestors.size > (MAX_SERVICE_DEPENDENCY_DEPTH - 1)) {
      this.#logger.warn(`Service dependency depth exceeds ${MAX_SERVICE_DEPENDENCY_DEPTH}, ${serviceName} will start immediately without loading/requiring or starting it sub-services`, 'SM-P-3003')
      return service
    }

    // new chain otherwise the same chain is used by the entire dependency tree
    const ancestorsChain = new Set([...ancestors])
    ancestorsChain.add(serviceName)

    return Promise.allSettled(
      subRequireServices.map(subServiceName => this.#staticDependencyAnalysis(subServiceName, ancestorsChain))
    )
  }

  /**
   * Start a single service
   * @param {string} serviceName
   * @param {Object.<SystemService|LibService|CustomizedService>} serviceInstance
   * @return {Promise.<*>}
   */
  #startSingleService (serviceName, serviceInstance) {
    try {
      if (serviceInstance.getStatus() === SERVICE_STATUS.stopped) {
        // Wrap a Promise.resolve around service.start() to cater both Asynchronous and Synchronous `start` hook
        return Promise.resolve(serviceInstance.start(createHostContext('service', serviceName)))
          .then(() => serviceName)
      }
      return Promise.resolve(serviceName)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  /**
   * Link the service to its required services, so that this service start after all required services started
   * Link with Promise.allSettled
   * @param {string} serviceName
   * @param {Set.<string>} [ancestors] - Parent services of this service in hierarchy order
   */
  #buildStartServiceLinkedTree (serviceName, ancestors = new Set()) {
    // The start of this service has been linked before, use it
    if (this.#serviceStartNode[serviceName]) return this.#serviceStartNode[serviceName]

    // Circular dependency check - if detected, it will resolve without start again, so that its parent will load & start despite its status
    // set vocal = false as the log is already printed in the #addressStaticDep
    if (this.#checkCircularDependency(serviceName, ancestors, false)) return Promise.resolve()

    const service = this.getServiceSync(serviceName)
    if (!service) {
      this.#logger.warn('Skip building service start linked tree for a un-loaded service. You should call it after the service is loaded.', 'SM-O-3001')
      return
    }
    const subServices = typeof service.require === 'function' ? (service.require() || []) : []

    /* Atomic service (or service reaching the MAX_SERVICE_DEPENDENCY_DEPTH) */
    if (!subServices.length || ancestors.size > (MAX_SERVICE_DEPENDENCY_DEPTH - 1)) {
      const startServicePromise = new Promise((resolve, reject) => {
        const startAtomicService = () => {
          // Thunk promise to delay the actual start of the service AFTER the static tree is completely resolved
          this.#startSingleService(serviceName, service).then(resolve, reject)
        }
        this.#atomicServiceSequence[serviceName] = startAtomicService
      })
      // Cache it, so that this linked-tree node can be linked by another service requires this atomic service again
      this.#serviceStartNode[serviceName] = startServicePromise
      return startServicePromise
    }
    /* end of Atomic Service start */

    /* Service that requires other sub-service(s) */
    // new chain otherwise the same chain is used by the entire dependency tree
    const ancestorsChain = new Set([...ancestors])
    ancestorsChain.add(serviceName)
    const startServicePromise = Promise.allSettled(
      subServices.map(subServiceName => this.#buildStartServiceLinkedTree(subServiceName, ancestorsChain))
    ).then(() => this.#startSingleService(serviceName, service))

    this.#serviceStartNode[serviceName] = startServicePromise
    return startServicePromise
  }

  /**
   * Get specified service instance by config.
   * If the service is not loaded before, register in the meta and service cache
   * If the service is loaded before, use the instance in service cache
   * @param {string} name
   * @return {Promise.<Object.<SystemService|LibService|CustomizedService|null>>}
   */
  getService (name = '') {
    let instance = this.#serviceCache[name]
    if (instance) return Promise.resolve(instance)

    this.#syncConfigToServiceMeta(name)
    if (!this.#serviceMetas[name]) return Promise.reject(new Error(`The service '${name}' is not registered`))

    switch (this.#serviceMetas[name].type) {
      case SERVICE_TYPE_SYSTEM:
      case SERVICE_TYPE_CUSTOMIZED:
        instance = this.getServiceSync(name)
        return instance
          ? Promise.resolve(instance)
          : Promise.reject(new Error(`The service '${name}' is not registered`))
      case SERVICE_TYPE_LIB:
        return this.#loadLibService(name)
          .then((loadedInstance) => {
            // replace the promise with actual service instance
            this.#registerService(name, loadedInstance)
            // this.#logger.debug(`Loaded Lib Service '${name}'`, 'SM')
          })
          .catch(() => {
            delete this.#serviceCache[name]
            delete this.#serviceMetas[name]
            this.#servicesWithError.add(name)
            // this.#logger.debug(`Error Loading dummy Lib Service '${name}', skip it`, 'SM')
          })
    }
  }

  /**
   * Get the specified service instance synchronously
   * [Attention] This method is meant to be used when you are sure the service is loaded and exists in service cache
   * @param {string} name
   * @return {Object.<SystemService|LibService|CustomizedService|null>}
   */
  getServiceSync (name) {
    let instance = this.#serviceCache[name || '']
    if (instance) return instance

    // System service that is get for the 1st time, register it to the service cache
    // All system services are registered immediately as they are all loaded synchronously
    if (name === ROUTER_SERVICE) {
      const { options } = configManager.getServiceConfig(ROUTER_SERVICE)
      instance = new RouterService(options, globalState.history)
    } else {
      // this is the available system service mapping
      instance = systemServices[name]
      if (!instance) {
        this.#logger.warn(`Service '${name}' is missing or not loaded.`, 'SM-P-3004')
        return null
      }
    }
    this.#registerService(name, instance)
    return instance
  }

  /**
   * @interface LibService
   */

  /**
   * @interface CustomizedService
   */

  /**
   * Register a customized service (Not defined in config) instance with specified name.
   * Report error if service with name is already exist, and it is a system service or marked with protected.
   * @param {string} name - service name defined in config
   * @param {Object.<CustomizedService>} instance - loaded Service instance
   * @param {ControllableServiceCustomizedServiceConfig} [config]
   */
  addService (name, instance, config = {}) {
    if (this.#state.stitchStart) {
      this.#logger.error('The Stitch has been started, can not add service anymore.', 'SM-O-5010')
      return
    }

    if (!name) {
      this.#logger.error('Service name is mandatory, please provide', 'SM-P-4002')
      return
    }

    if (!instance) {
      this.#logger.warn('Service instance you provide is not loaded or corrupted', 'SM-P-3005')
      return
    }

    /**
     * @typedef {object} ControllableServiceCustomizedServiceConfig
     * @property {boolean} [disabled]
     * @property {boolean} [protected]
     */
    const { disabled = false, protected: isProtected = false } = config

    /** @type {ServiceMeta} **/
    const meta = {
      name,
      type: SERVICE_TYPE_CUSTOMIZED,
      disabled,
      protected: isProtected
    }

    Object.freeze(meta)
    this.#serviceMetas[name] = meta
    this.#registerService(name, instance)
  }

  /**
   * Remove a service instance with specified name.
   * Report error if service with name is already exist, and it is a system service or marked with protected.
   * @param {string} name
   */
  removeService (name) {
    const meta = this.#serviceMetas[name]
    if (meta.protected) {
      this.#logger.error(`Service '${name}' is protected and CANNOT be removed`, 'SM-B-4001')
      return
    }
    delete this.#serviceMetas[name]
    delete this.#serviceCache[name]
  }

  /**
   * Construct and initiate services against filter criteria. filter could be a partial object of service config
   * For example: ServiceManager.getServices({ protected: true }) // get all the active protected services
   * @param {object|function} [criteria]
   * @return {Promise.<(SystemService|LibService|CustomizedService)[]>}
   */
  getServices (criteria = {}) {
    this.#syncConfigToServiceMetas()

    /** type {function(ServiceConfig, object|function):boolean} */
    let filterFunc
    if (typeof criteria === 'function') filterFunc = filterServiceByFunc
    else if (criteria.constructor === Object) filterFunc = filterServiceByParams
    else return Promise.reject(new Error('Invalid service filter criteria is provided.'))

    return Promise.allSettled(
      Object.values(this.#serviceMetas)
        .filter(serviceMeta => !serviceMeta.disabled) // if disabled, it is not accessible regarding any circumstance
        .filter(serviceMeta => filterFunc(serviceMeta, criteria))
        .map(serviceMeta => this.getService(serviceMeta.name))
    )
  }

  /**
   * @param {Array.<string>} requiredServices
   * @return {Promise.<StartServicesResults>}
   */
  async startServices (requiredServices) {
    if (!Array.isArray(requiredServices)) {
      this.#logger.warn('Invalid start sequence of services is provided to start sequence, skipping', 'SM-P-3006')
      return Promise.resolve([])
    }
    // clear previous start sequence
    this.#atomicServiceSequence = {}
    this.#serviceStartNode = {}

    // Step - 1: (Async) Dependency tree analysis. Construct a static dependency tree (linked by Promise.all) top down. Started with given service as the top level (entry points)
    await Promise.allSettled(requiredServices.map(serviceName => this.#staticDependencyAnalysis(serviceName)))

    // Step - 2: (Sync) Start sequence as Linked Tree
    requiredServices.forEach(serviceName => this.#buildStartServiceLinkedTree(serviceName))

    // Step - 3: Start all the atomic Services, and their parent services will be started according to the start service linked-tree (services that DO NOT require any other service)
    Object.values(this.#atomicServiceSequence).forEach(startAtomicService => startAtomicService())

    // Step - 4: Wrapping up for results and exceptions
    const requiredServiceStartPromises = requiredServices.map(serviceName => this.#serviceStartNode[serviceName])
    return Promise.allSettled(requiredServiceStartPromises).then(
      () => (
        /**
         * @typedef {Object} StartServicesResults
         * @property {Array.<ManagedServiceConfig.name>} success
         * @property {Array.<ManagedServiceConfig.name>} errors
         */
        {
          success: [...requiredServices],
          // TODO start Services error stack
          errors: []
        }
      ),
      // This is total crash, error must be printed otherwise it might not be verbal if it is caught by downstream promise chain
      (err) => {
        this.#logger.error(err, 'SM-O-5001')
        throw err
      }
    )
  }

  /**
   * Start prioritized/critical services in Stitch.start()
   * [Attention] This is intended to use during Stitch.start() only. And run after all Async service loaded already (e.g Library services loaded)
   * If you use somewhere else, use with discretion;
   * @return {Promise.<StartServicesResults>}
   */
  startAllServices () {
    this.#syncConfigToServiceMetas()
    const availableServices = Object.values(this.#serviceMetas)

    // At current version, we start all system services + autoLoad library services + customized services upon Stitch start
    const systemServices = availableServices.filter(service => service.type === SERVICE_TYPE_SYSTEM)
    const autoLoadLibServices = availableServices.filter(service =>
      (service.type === SERVICE_TYPE_LIB && service[SERVICE_AUTOLOAD])
    )
    const customizedServices = Object.values(this.#serviceMetas).filter(service => service.type === SERVICE_TYPE_CUSTOMIZED)
    return this.startServices(
      [...systemServices, ...autoLoadLibServices, ...customizedServices].map(service => service.name)
    )
  }
}

export default new ServiceManager()
