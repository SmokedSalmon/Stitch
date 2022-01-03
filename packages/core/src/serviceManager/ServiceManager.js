import { MFEService } from '@stitch/types'

import configManager from '../configManager'
import loadModule from '../utils/loadModule'
import { messageService, styleService } from '../services'
import {
  SERVICE_TYPE_SYSTEM,
  SERVICE_TYPE_LIB,
  SERVICE_TYPE_CUSTOMIZED
} from './constants'
import { globalState } from '../utils'
import { MESSAGE_SERVICE, STYLE_SERVICE, SERVICE_STATUS } from '../constants'
import HostContext from '../HostContext'

/**
 * @typedef {MessageService | StyleService} SystemService
 */

const systemServices = {
  [MESSAGE_SERVICE]: messageService,
  [STYLE_SERVICE]: styleService
}

/**
 * Filter services by object parameter
 * @param {ServiceConfig} serviceConfig - given service's config
 * @param {ServiceConfig} params - parameter object for desired service
 * @return {boolean}
 */
function filterServiceByParams (serviceConfig, params = {}) {
  const keys = Object.keys(params).filter(key => Object.hasOwnProperty.call(params, key))
  return keys.every(property => serviceConfig[property] === params[property])
}

/**
 * Filter services by an enumerator function, which takes a variable as the passed-in service definition/config
 * @param {ServiceConfig} serviceConfig
 * @param {function(ServiceConfig):boolean} func
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

  constructor () {
    this.#state = globalState
    this.#serviceCache = {}
    this.#serviceMetas = {}
    this.#servicesWithError = new Set()

    Object.freeze(this)
  }

  #registerService (name, instance) {
    if (!(instance instanceof MFEService)) {
      console.warn(`Service '${name}' is not a instance of MFEService from @stitch/types`)
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
    return new Promise((resolve, reject) => {
      if (typeof window[libName] !== 'undefined') return resolve()
      loadModule(
        libUrl,
        (event) => {
          if (typeof window[libName] !== 'undefined') return resolve()
          const errorType = event && (event.type === 'load' ? 'missing' : event.type)
          const realSrc = event && event.target && event.target.src
          const error = {}
          error.message = 'Loading script failed.\n(' + errorType + ': ' + realSrc + ')'
          error.name = 'ScriptExternalLoadError'
          error.type = errorType
          error.request = realSrc
          reject(error)
        },
        name
      )
    })
      .then(() => {
        return window[libName]
        // 'services' module, defined in remote module's webpack config - ModuleFederationPlugin plugin's library.name
          .get('services')
          .then(module => module().default.getService(name))
          .catch(err => {
            console.error(`Cannot find service '${name} in module '${libName}' @ '${libUrl}'`)
            throw err
          })
      })
  }

  #addressStaticDep (serviceName) {
    if (this.#serviceStartNode[serviceName]) return this.#serviceStartNode[serviceName]
    const service = this.getService(serviceName)
    const subRequireServices = service.require && service.require()
    if (!subRequireServices || !subRequireServices.length) {
      const servicePromise = new Promise((resolve, reject) => {
        // create a thunk function to delay the actual start of the service AFTER the static tree is completely resolved
        const startAtomicService = () => {
          try {
            Promise.resolve(
              service.getStatus() !== SERVICE_STATUS.stopped ? null : service.start(new HostContext('service', serviceName))
            ).then(resolve, reject)
          } catch (err) {
            reject(err)
          }
        }
        this.#atomicServiceSequence.push(startAtomicService)
      })
      this.#serviceStartNode[serviceName] = servicePromise
      return servicePromise
    }

    const subServicePromises = subRequireServices.map(subServiceName => this.#addressStaticDep(subServiceName))
    const servicePromise = Promise.allSettled(subServicePromises).then(() => {
      try {
        return Promise.resolve(
          service.getStatus() !== SERVICE_STATUS.stopped ? null : service.start(new HostContext('service', serviceName, subRequireServices))
        )
      } catch (err) {
        return Promise.reject(err)
      }
    })
    this.#serviceStartNode[serviceName] = servicePromise
    return servicePromise
  }

  /**
   * Get specified service instance by config.
   * If the service is not loaded before, register in the meta and service cache
   * If the service is loaded before, use the instance in service cache
   * @param {string} name
   * @return {SystemService | Object.<LibService> | Promise.<Object.<LibService>> | Object.<CustomizedService> | null}
   */
  getService (name = '') {
    let instance = this.#serviceCache[name]
    if (instance) return instance

    const serviceConfig = configManager.getServiceConfig(name)
    if (!serviceConfig) {
      console.warn(`Cannot find service config of '${name}'`)
      return null
    }
    if (this.#servicesWithError.has(name)) {
      // console.warn(`Service '${name}' has error or corrupted, skip it`)
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

    switch (type) {
      case SERVICE_TYPE_SYSTEM:
        instance = systemServices[name]
        break
      case SERVICE_TYPE_LIB:
        instance = this.#loadLibService(name)
          .then((loadedInstance) => {
            // replace the promise with actual service instance
            this.#registerService(name, loadedInstance)
            // console.log(`Loaded Lib Service '${name}'`)
          })
          .catch(() => {
            delete this.#serviceCache[name]
            delete this.#serviceMetas[name]
            this.#servicesWithError.add(name)
            // console.log(`Error Loading dummy Lib Service '${name}', skip it`)
          })
        break
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
      throw new Error('The Stitch has been started, can not add service anymore.')
    }

    if (!name) {
      console.error('Service name is mandatory, please provide')
      return
    }

    if (!instance) {
      console.warn('Service instance you provide is not loaded or corrupted')
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
      console.error(`Service '${name}' is protected and CANNOT be removed`)
      return
    }
    delete this.#serviceMetas[name]
    delete this.#serviceCache[name]
  }

  /**
   * Construct and initiate services against filter criteria. filter could be a partial object of service config
   * For example: ServiceManager.getServices({ protected: true }) // get all the active protected services
   * @param {object|function} [criteria]
   * @return {Array.<SystemService | Object.<LibService> | Promise.<Object.<LibService>> | Object.<CustomizedService>>}
   */
  getServices (criteria = {}) {
    const serviceMetasFromConfigs = Object.keys(configManager.getServiceConfig())
      .map(i => configManager.getServiceConfig()[i])
      .filter(serviceConfig => !this.#servicesWithError.has(serviceConfig.serviceName))
      .map(serviceConfig => {
        const serviceMeta = { ...serviceConfig, name: serviceConfig.serviceName }
        delete serviceMeta.serviceName
        return serviceMeta
      })

    const addedCustomizedServiceMetas = Object.entries(this.#serviceMetas)
      .filter(([name, serviceMeta]) => serviceMeta.type === SERVICE_TYPE_CUSTOMIZED)
      .map(([name, serviceMeta]) => serviceMeta)

    const serviceMetas = serviceMetasFromConfigs.concat(...addedCustomizedServiceMetas)

    /** type {function(ServiceConfig, object|function):boolean} */
    let filterFunc
    if (typeof criteria === 'function') filterFunc = filterServiceByFunc
    else if (criteria.constructor === Object) filterFunc = filterServiceByParams
    else {
      throw new TypeError('Invalid service filter criteria is provided.')
    }

    return serviceMetas
      .filter(serviceMeta => !serviceMeta.disabled) // if disabled, it is not accessible regarding any circumstance
      .filter(serviceMeta => filterFunc(serviceMeta, criteria))
      .map(serviceMeta => this.getService(serviceMeta.name))
  }

  /**
   * @param {Array.<string>} requiredServices
   * @return {Promise.<Array>}
   */
  startServices (requiredServices) {
    if (!Array.isArray(requiredServices)) {
      console.warn('Invalid start sequence of services is provided to start sequence, skipping')
      return Promise.resolve([])
    }
    // clear previous start sequence
    this.#atomicServiceSequence = []
    this.#serviceStartNode = {}

    // static tree analysis step. Construct a static dependency tree (linked by Promise.all) top down. Started with given service as the top level (entry points)
    requiredServices.forEach(serviceName => this.#addressStaticDep(serviceName))
    // actually start all the atomic Services (services that DO NOT require any other service)
    this.#atomicServiceSequence.forEach(startAtomicService => startAtomicService())
    const servicePromises = requiredServices.map(serviceName => this.#serviceStartNode[serviceName])
    return Promise.allSettled(servicePromises).then(
      () => ({
        success: [...requiredServices],
        // TODO start Services error stack
        errors: []
      }),
      // This is total crash, error must be printed otherwise it might not be verbal if it is caught by downstream promise chain
      (err) => {
        console.error(err)
        throw err
      }
    )
  }

  /**
   * Start all services in Stitch.start()
   * @return {Promise.<Array>}
   */
  startAllServices () {
    // TODO
    return Promise.allSettled([])
  }
}

export default new ServiceManager()
