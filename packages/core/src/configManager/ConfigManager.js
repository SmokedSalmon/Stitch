import { uniqueId } from 'lodash'

import * as schemas from './schemas'
import getValidate from './validate'
import { SERVICE_TYPE_SYSTEM, SERVICE_TYPE_LIB, SERVICE_TYPE_CUSTOMIZED } from '../serviceManager/constants'
import { globalState } from '../utils'
import { MESSAGE_SERVICE, STYLE_SERVICE } from '../constants'

/** @type {function: ValidateFunction} */
const validate = getValidate(schemas.base)

const STITCH_MFE_STYLE_PREFIX = 'stitch_mfe_style'

const defaultSystemServicesConfig = [
  {
    serviceName: MESSAGE_SERVICE,
    disabled: false,
    protected: true
  },
  {
    serviceName: STYLE_SERVICE,
    disabled: false,
    protected: true
  }
]

class ConfigManager {
  #state
  #config
  #hosts
  #styles
  #apps
  #libs
  #services

  #convertConfig (config) {
    this.#state = globalState

    this.#config = config
    globalState.configEnv = config.env

    // generate #hosts url list from raw config.hosts config list
    this.#hosts = (config.hosts || []).reduce((hosts, item) => {
      const {
        hostName,
        protocol,
        server,
        port,
        publicPath
      } = item

      if (hosts[hostName]) {
        throw new Error(`Duplicate definition of hostName (${hostName}) in config.hosts`)
      }

      return {
        ...hosts,
        [hostName]: `${protocol}://${server}${port ? `:${port}` : ''}${publicPath}`
      }
    }, {})

    this.#styles = {}

    this.#apps = {}

    this.#libs = config.libs.reduce((libs, item) => {
      const {
        libName,
        hostName,
        resource,
        styles = [],
        apps,
        services = []
      } = item

      if (libs[libName]) {
        throw new Error(`Duplicate definition of libName (${libName}) in config.libs`)
      }

      let libUrl = resource
      if (hostName && !/^(?:https?:\/\/|\/\/)/.test(resource)) {
        if (!this.#hosts[hostName]) {
          throw new Error(`Missing host definition of hostName (${hostName}) in config.hosts for getting libUrl by relative path of libs resource (${libName})`)
        }

        libUrl = `${this.#hosts[hostName]}${resource}`
      }

      const libStyles = {}
      styles.forEach(libStyleItem => {
        const {
          styleName,
          hostName: styleHostName = hostName,
          resource: styleResource,
          autoLoad
        } = libStyleItem

        let styleUrl = styleResource
        if (styleHostName && !/^(?:https?:\/\/|\/\/)/.test(styleResource)) {
          if (!this.#hosts[styleHostName]) {
            throw new Error(`Missing host definition of hostName (${styleHostName}) in config.hosts for getting styleUrl by relative path of libs.styles resource (${libName})`)
          }

          styleUrl = `${this.#hosts[styleHostName]}${styleResource}`
        }

        const uniqueID = uniqueId(STITCH_MFE_STYLE_PREFIX + '_')

        /**
         * @typedef {object} StyleConfig
         * @property {string} uniqueID
         * @property {string} styleName
         * @property {string} libName
         * @property {string} styleUrl
         * @property {boolean} autoLoad
         */
        const libStyleConfig = {
          uniqueID,
          styleName,
          libName,
          styleUrl,
          autoLoad
        }

        if (libStyles[styleName]) {
          throw new Error(`Duplicate definition of styles.styleName (${styleName}) in config.libs (${libName})`)
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
          routerName = name,
          options = {},
          styles: appStyles = []
        } = libAppItem

        const validAppStyles = appStyles.reduce((results, styleName) => {
          if (!libStyles[styleName]) {
            throw new Error(`Missing styleName of style (${styleName}) in config.libs (${libName})`)
          }

          return [
            ...results,
            libStyles[styleName]
          ]
        }, [])

        /**
         * @typedef {object} AppConfig
         * @property {string} name
         * @property {string} libName
         * @property {string} libUrl
         * @property {string} mode
         * @property {string} routerName
         * @property {Array.<StyleConfig>} styles
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

        const appName = routerName || name

        if (this.#apps[appName]) {
          throw new Error(`Duplicate definition of apps.name or apps.routerName (${appName}) in config.libs`)
        }

        this.#apps[appName] = libAppConfig

        return {
          ...libApps,
          [appName]: libAppConfig
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

    const defaultSystemServices = defaultSystemServicesConfig.reduce((services, item) => [...services, item.serviceName], [])

    // generate #services config set from raw config.services config list
    this.#services = defaultSystemServicesConfig
      .reduce((services, item) => [
        ...services,
        {
          ...item,
          type: SERVICE_TYPE_SYSTEM,
          ...(config.services || []).find(({ serviceName }) => serviceName === item.serviceName)
        }
      ], [])
      .concat((config.services || []).filter(({ serviceName }) => !defaultSystemServices.includes(serviceName)))
      .reduce((services, item) => {
        const {
          serviceName,
          type = SERVICE_TYPE_CUSTOMIZED,
          disabled,
          protected: isProtected, // avoid `'protected' is reserved syntax error`
          options = {}
        } = item

        if (services[serviceName]) {
          throw new Error(`Duplicate definition of serviceName (${serviceName}) in config.services`)
        }

        return {
          ...services,
          /**
         * @typedef {Object} ServiceConfig
         * @property {string} serviceName
         * @property {string} type
         * @property {string} [libName]
         * @property {string} [libUrl]
         * @property {boolean} [autoLoad]
         * @property {boolean} disabled
         * @property {boolean} protected
         * @property {object} [options]
         */
          [serviceName]: {
            serviceName,
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
          serviceName,
          autoLoad,
          disabled,
          protected: isProtected, // avoid `'protected' is reserved syntax error`
          options = {}
        } = item

        // generate #services config set from raw config.libs.services config list
        /** @type {ServiceConfig} */
        this.#services[serviceName] = {
          serviceName,
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
      throw new Error('The Stitch has been started, can not set global config options anymore.')
    }

    this.#config.globalOptions = options
  }

  validateConfig (config) {
    const valid = validate(config)

    if (!valid) {
      const {
        instancePath,
        message
      } = validate.errors[0]
      throw new Error(`Config validate failed: ${instancePath} ${message}`)
    }

    return valid
  }

  updateConfig (config) {
    if (this.validateConfig(config)) {
      this.#convertConfig(config)
    }
  }

  /**
   * @param {string} appName
   * @param {Object.<AppConfig.options>} options
   */
  setAppOptions (appName, options = {}) {
    if (this.#state.stitchStart) {
      throw new Error('The Stitch has been started, can not set app config options anymore.')
    }

    this.#apps[appName].options = options
  }

  /**
   * @param {string} [appName]
   * @return {AppConfig | Object.<string, AppConfig>}
   */
  getAppConfig (appName) {
    if (appName) {
      return this.#apps[appName]
    }

    return this.#apps
  }

  /**
   * @param {string} serviceName
   * @param {Object.<ServiceConfig.options>} options
   */
  setServiceOptions (serviceName, options = {}) {
    if (this.#state.stitchStart) {
      throw new Error('The Stitch has been started, can not set service config options anymore.')
    }

    this.#services[serviceName].options = options
  }

  /**
   * @param {string} [serviceName]
   * @return {ServiceConfig | Object.<string, ServiceConfig>}
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
   * @return {Array.<StyleConfig>}
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
