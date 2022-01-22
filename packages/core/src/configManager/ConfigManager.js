import { uniqueId, cloneDeep } from 'lodash'

import * as schemas from './schemas'
import getValidate from './validate'
import { SERVICE_TYPE_SYSTEM, SERVICE_TYPE_LIB, SERVICE_TYPE_CUSTOMIZED } from '../serviceManager/constants'
import { systemServiceConfigs } from '../services/constants'
import { globalState, log } from '../utils'

/** @type {function: ValidateFunction} */
export const validate = getValidate(schemas.base)

const STITCH_MFE_STYLE_PREFIX = 'stitch_mfe_style'

class ConfigManager {
  #logger = log.getLogger('ConfigManager')
  #state = {}
  #config
  #hosts
  #styles = {}
  #apps = {}
  #routerNames = []
  #libs
  #services

  #convertConfig (config) {
    this.#state = globalState

    this.#config = config
    globalState.configEnv = config.env

    // generate #hosts url list from raw config.hosts config list
    this.#hosts = (config.hosts || []).reduce((hosts, item) => {
      const {
        name,
        protocol,
        server,
        port,
        publicPath
      } = item

      if (hosts[name]) {
        throw new TypeError(`Duplicate definition of 'name' (${name}) in config.hosts`)
      }

      return {
        ...hosts,
        [name]: `${protocol}://${server}${port ? `:${port}` : ''}${publicPath}`
      }
    }, {})

    this.#libs = (config.libs || []).reduce((libs, item) => {
      const {
        name: libName,
        hostName,
        resource,
        styles = [],
        apps,
        services = []
      } = item

      if (libs[libName]) {
        throw new TypeError(`Duplicate definition of 'name' (${libName}) in config.libs`)
      }

      let libUrl = resource
      if (hostName && !/^(?:https?:\/\/|\/\/)/.test(resource)) {
        if (!this.#hosts[hostName]) {
          throw new TypeError(`Missing host definition of 'name' (${hostName}) in config.hosts for getting libUrl by relative path of libs resource (${libName})`)
        }

        libUrl = `${this.#hosts[hostName]}${resource}`
      }

      const libStyles = {}
      styles.forEach(libStyleItem => {
        const {
          name: styleName,
          hostName: styleHostName = hostName,
          resource: styleResource,
          autoLoad
        } = libStyleItem

        let styleUrl = styleResource
        if (styleHostName && !/^(?:https?:\/\/|\/\/)/.test(styleResource)) {
          if (!this.#hosts[styleHostName]) {
            throw new TypeError(`Missing host definition of 'name' (${styleHostName}) in config.hosts for getting styleUrl by relative path of libs.styles resource (${libName})`)
          }

          styleUrl = `${this.#hosts[styleHostName]}${styleResource}`
        }

        const uniqueID = uniqueId(STITCH_MFE_STYLE_PREFIX + '_')

        /**
         * @typedef {object} ManagedStyleConfig
         * @property {string} uniqueID
         * @property {string} name
         * @property {string} libName
         * @property {string} styleUrl
         * @property {boolean} autoLoad
         */
        const libStyleConfig = {
          uniqueID,
          name: styleName,
          libName,
          styleUrl,
          autoLoad
        }

        if (libStyles[styleName]) {
          throw new TypeError(`Duplicate definition of styles.name (${styleName}) in config.libs (${libName})`)
        }

        libStyles[styleName] = libStyleConfig

        this.#styles[uniqueID] = libStyleConfig
      }, {})

      /*
       * - generate _libs.apps config set of applications from raw config.libs.apps list
       * - generate _apps
       */
      const validApps = (apps || []).reduce((libApps, libAppItem) => {
        const {
          name,
          mode,
          routerName,
          options = {},
          styles: appStyles = []
        } = libAppItem

        const validAppStyles = appStyles.reduce((results, styleName) => {
          if (!libStyles[styleName]) {
            throw new TypeError(`Missing the definition of style (name: ${styleName}) in config.libs (${libName})`)
          }

          return [
            ...results,
            libStyles[styleName]
          ]
        }, [])

        /**
         * @typedef {object} ManagedAppConfig
         * @property {string} name
         * @property {string} libName
         * @property {string} libUrl
         * @property {string} mode
         * @property {string[]} routerName
         * @property {Array.<ManagedStyleConfig>} styles
         * @property {object} [options]
         */
        const libAppConfig = {
          name,
          libName,
          libUrl,
          mode,
          routerName,
          styles: validAppStyles,
          options
        }

        if (this.#apps[name]) {
          throw new TypeError(`Duplicate definition of apps.name (${name}) in config.libs`)
        }

        // set the routerName to the app's name by default
        if (routerName.length === 0) {
          routerName.push(name)
        }

        routerName.forEach((item, index) => {
          if (this.#routerNames.includes(item)) {
            throw new TypeError(`Duplicate definition of apps.routerName[${index}] (${item}) in config.libs (appName: '${name}')`)
          }

          this.#routerNames.push(item)
        })

        this.#apps[name] = libAppConfig

        return {
          ...libApps,
          [name]: libAppConfig
        }
      }, {})

      return {
        ...libs,
        [libName]: {
          name: libName,
          libUrl,
          styles: libStyles,
          apps: validApps,
          services
        }
      }
    }, {})

    const defaultSystemServices = systemServiceConfigs.reduce((services, item) => [...services, item.name], [])

    // generate #services config set from raw config.services config list
    this.#services = systemServiceConfigs
      .reduce((services, item) => [
        ...services,
        {
          ...item,
          type: SERVICE_TYPE_SYSTEM,
          ...(config.services || []).find(({ name }) => name === item.name)
        }
      ], [])
      .concat((config.services || []).filter(({ name }) => !defaultSystemServices.includes(name)))
      .reduce((services, item) => {
        const {
          name: serviceName,
          type = SERVICE_TYPE_CUSTOMIZED,
          disabled,
          protected: isProtected, // avoid `'protected' is reserved syntax error`
          options = {}
        } = item

        if (services[serviceName]) {
          throw new TypeError(`Duplicate definition of 'name' (${serviceName}) in config.services`)
        }

        return {
          ...services,
          /**
         * @typedef {Object} ManagedServiceConfig
         * @property {string} name
         * @property {string} type
         * @property {string} [libName]
         * @property {string} [libUrl]
         * @property {boolean} [autoLoad]
         * @property {boolean} disabled
         * @property {boolean} protected
         * @property {object} [options]
         */
          [serviceName]: {
            name: serviceName,
            type,
            disabled,
            protected: isProtected,
            options
          }
        }
      }, {})

    // convert _libs.services names list to services config set
    Object.keys(this.#libs).forEach((libName) => {
      this.#libs[libName].services = this.#libs[libName].services.reduce((services, item) => {
        const {
          name: serviceName,
          autoLoad,
          disabled,
          protected: isProtected, // avoid `'protected' is reserved syntax error`
          options = {}
        } = item

        if (services[serviceName]) {
          throw new TypeError(`Duplicate definition of 'name' (${serviceName}) in 'services' item of config.libs (${libName})`)
        }

        // generate #services config set from raw config.libs.services config list
        /** @type {ManagedServiceConfig} */
        this.#services[serviceName] = {
          name: serviceName,
          type: SERVICE_TYPE_LIB,
          libName,
          libUrl: this.#libs[libName].libUrl,
          autoLoad,
          disabled,
          protected: isProtected,
          options
        }

        return {
          ...services,
          [serviceName]: this.#services[serviceName]
        }
      }, {})
    })
  }

  constructor () {
    Object.freeze(this)
  }

  getRawConfig () {
    return this.#config
  }

  getOrgConfig () {
    return this.#config.org
  }

  getEnv () {
    return this.#config.env
  }

  getRouterPath () {
    return this.#config.routerPath
  }

  getGlobalOptions () {
    return this.#config.globalOptions
  }

  /**
   * @param {options} options
   */
  setGlobalOptions (options = {}) {
    if (this.#state.stitchStart) {
      this.#logger.error('The Stitch has been started, can not set global config options anymore.', 'CM-O-4001')
      return
    }

    this.#config.globalOptions = options
  }

  /**
   * @param {object} config - the input config object can NOT be immutable
   * @return {boolean}
   * @affect will add some properties with default value by schemas
   */
  validateConfig (config) {
    let valid = false

    try {
      valid = validate(config)
    } catch (validError) {
      this.#logger.fatal(validError, 'CM-P-5001')
      throw validError
    }

    return valid
  }

  updateConfig (config) {
    if (this.#state.stitchStart) {
      this.#logger.error('The Stitch has been started, can not update config anymore.', 'CM-O-4001')
      return
    }

    const mutableConfig = cloneDeep(config)

    if (this.validateConfig(mutableConfig)) {
      try {
        this.#convertConfig(mutableConfig)
      } catch (convertError) {
        this.#logger.fatal(convertError, 'CM-P-5002')
        throw convertError
      }
    }
  }

  /**
   * @param {string} appName
   * @param {Object.<ManagedAppConfig.options>} options
   */
  setAppOptions (appName, options = {}) {
    if (this.#state.stitchStart) {
      this.#logger.error('The Stitch has been started, can not set app config options anymore.', 'CM-O-4001')
      return
    }

    this.#apps[appName].options = options
  }

  /**
   * @param {string} [appName]
   * @return {ManagedAppConfig | Object.<string, ManagedAppConfig>}
   */
  getAppConfig (appName) {
    if (appName) {
      return this.#apps[appName]
    }

    return this.#apps
  }

  /**
   * @param {string} routerName
   * @return {string}
   */
  getAppName (routerName) {
    if (routerName) {
      return Object.keys(this.#apps).find((appName) => this.#apps[appName].routerName.includes(routerName)) || ''
    }

    return ''
  }

  /**
   * @param {string} serviceName
   * @param {Object.<ManagedServiceConfig.options>} options
   */
  setServiceOptions (serviceName, options = {}) {
    if (this.#state.stitchStart) {
      this.#logger.error('The Stitch has been started, can not set service config options anymore.', 'CM-O-4001')
      return
    }

    // we should merge the option instead of overwrite it
    this.#services[serviceName].options = {
      ...this.#services[serviceName].options,
      ...options
    }
  }

  /**
   * @param {string} [serviceName]
   * @return {ManagedServiceConfig | Object.<string, ManagedServiceConfig>}
   */
  getServiceConfig (serviceName) {
    if (serviceName) {
      return this.#services[serviceName]
    }

    return this.#services
  }

  /**
   * @param {string} libName - when passed as value of style config uniqueID, will return the matched style config directly
   * @param {string} [styleName]
   * @return {Array.<ManagedStyleConfig>}
   */
  getStyleConfig (libName, styleName) {
    // first parameter as uniqueID
    if (libName.indexOf(STITCH_MFE_STYLE_PREFIX) === 0) {
      return [this.#styles[libName]]
    }

    if (libName && styleName) {
      return [this.#libs[libName].styles[styleName]]
    }

    return Object.values(this.#libs[libName].styles)
  }
}

export default new ConfigManager()
