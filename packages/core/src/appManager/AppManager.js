import { MFEApp } from '@stitch/types'

import loadModule from '../utils/loadModule'
import configManager from '../configManager'
import createHostContext from '../HostContext'
import serviceManager from '../serviceManager'
import { APP_STATUS, REMOTE_APP } from '../constants'

class AppManager {
  #appCache

  /**
   * Return a promise with remote app instance as result
   * @param {ManagedAppConfig} appConfig
   * @return {Promise<any>}
   */
  #loadAppInstance (appConfig) {
    if (!appConfig) { throw new Error('Missing appConfig parameter in loadAppInstance') }

    const { name, libName, libUrl } = appConfig

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
      .then(async () => {
        // eslint-disable-next-line no-undef
        await __webpack_init_sharing__('default')

        const container = window[libName] // or get the container somewhere else
        // Initialize the container, it may provide shared modules
        // eslint-disable-next-line no-undef
        await container.init(__webpack_share_scopes__.default)
        return container
          .get(REMOTE_APP)
          .then((appModule) => {
            try {
              return appModule().default
            } catch (error) {
              console.error(error)
              return undefined
            }
          })
      })
  }

  constructor () {
    this.#appCache = {}

    Object.freeze(this)
  }

  getApp (appName) {
    const appCache = this.#appCache
    return new Promise((resolve, reject) => {
      // get app from cache
      if (appCache[appName] && appCache[appName].instance) {
        resolve(appCache[appName].instance)
        return
      }

      // put the app in cache
      appCache[appName] = {
        instance: null,
        state: APP_STATUS.NotLoaded,
        hostContext: null
      }
      const app = appCache[appName]

      // can't find app in appConfig
      const config = configManager.getAppConfig(appName)
      if (!config || !config.name) {
        app.state = APP_STATUS.NotDefined
        reject(new Error(`Can not find app with name '${appName}' in config`))
        return
      }

      const loadAppError = (error) => {
        app.state = APP_STATUS.LoadError
        reject(error)
      }
      this.#loadAppInstance(config).then(instance => {

        app.instance = instance.getApp && instance.getApp(appName)

        if (app.instance) {
          if(!app.instance.init || !app.instance.mount || !app.instance.unmount) {
            loadAppError(new Error(`Can not find all life cycle functions in app: '${appName}' `))
            return
          }
          const requiredServices = app.instance.require && app.instance.require() || []
          const dummyRequiredServices = ['a1', 'a2']
          console.log('=== Start services ===')

          // cache the requiredServices for forceInit()
          // this.#appCache[appName].requiredServices = requiredServices
          // serviceManager.startServices(requiredServices)
          this.#appCache[appName].requiredServices = dummyRequiredServices
          serviceManager.startServices(dummyRequiredServices)
            .then(requireServices => {
              app.state = APP_STATUS.Loaded
              app.hostContext = createHostContext('app', appName, requireServices.success)
              Promise.resolve(app.instance.init(app.hostContext))
                .then(() => {
                  app.state = APP_STATUS.Initialized
                  resolve(app.instance)
                }).catch(loadAppError)
            }).catch(loadAppError)
          return
        }
        loadAppError(new Error(`Can not find app with name '${appName}' in instance`))
      }).catch(loadAppError)
    })
  }

  /**
   * Get MFE App state.

   * Not defined - MFE App with specified name is not defined in config
   * Not loaded - MFE App with specified name is defined in config, but not loaded yet.
   * Loaded - MFE App with specified name is loaded and initialized, but not mounted
   * Active - MFE App with specified name is mounted to screen
   * Inactive - MFE App with specified name is unmounted
   **/
  getState (appName) {
    const appConfig = configManager.getAppConfig(appName)
    if (!appConfig || !appConfig.name) return APP_STATUS.NotDefined
    if (!this.#appCache[appName]) return APP_STATUS.NotLoaded
    return this.#appCache[appName].state
  }

  setState (appName, state) {
    if (!this.#appCache[appName]) {
      console.warn(`Can not find app with name '${appName}' in setState`)
      return
    }
    this.#appCache[appName].state = state
  }

  getHostContext (appName) {
    if (!this.#appCache[appName]) {
      console.warn(`Can not find app with name '${appName}' in getHostContext`)
      return null
    }
    return this.#appCache[appName].hostContext
  }

  getConfig (appName) {
    return configManager.getAppConfig(appName)
  }

  /**
   * Force to reinitialize the MFE App, by re-constructing the hostContext and inject to it.
   * @param appName
   */
  forceInit (appName) {
    const appConfig = configManager.getAppConfig(appName)
    if (!appConfig || !appConfig.name) throw new Error(`Can not find app with name '${appName}'`)
    if (!this.#appCache[appName]) {
      this.getApp(appName)
      return
    }
    this.#appCache[appName].hostContext = createHostContext('app', appName, this.#appCache[appName].requiredServices)
    this.#appCache[appName].state = APP_STATUS.Loaded
  }
}

export default new AppManager()
