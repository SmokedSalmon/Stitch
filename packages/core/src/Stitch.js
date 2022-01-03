import appManager from './appManager'
import configManager from './configManager'
import serviceManager, { SERVICE_TYPE_LIB, SERVICE_AUTOLOAD } from './serviceManager'
import { globalState } from './utils'
import { RouterAdaptor } from './adaptor/router'

class Stitch {
  #state

  constructor () {
    this.#state = globalState

    Object.freeze(this)
  }

  config ({ config, router }) {
    configManager.updateConfig(config)

    if (!router) {
      throw new Error('Please provide a router instance for Stitch.')
    }

    if (!(router instanceof RouterAdaptor)) {
      throw new Error('The Router must be an implementation of RouterAdaptor.')
    }

    this.#state.router = router
  }

  start () {
    if (this.#state.stitchStart) {
      throw new Error('The Stitch has been started.')
    }

    return Promise.all(serviceManager.getServices({ type: SERVICE_TYPE_LIB, [SERVICE_AUTOLOAD]: true }))
      .then(() => {
        this.#state.stitchStart = true

        // start some critical/high priority service first
        serviceManager.startServices(['message_service', 'style_service'])

        return this
      }).catch(() => {
        this.#state.stitchStart = false
        throw new Error('The Stitch start fail.')
      })
  };

  /**
   * Pupup console UI. Only take effect in dev mode.
   */
  showConsoleUI () {
    if (this.#state.devMode) {
      // TODO
    }
  };

  /**
   * Close console UI. Only take effect in dev mode.
   */
  hideConsoleUI () {
    if (this.#state.devMode) {
      // TODO
    }
  };

  getAppManager () {
    return appManager
  };

  getConfigManager () {
    return configManager
  }

  getServiceManager () {
    return serviceManager
  }

  setGlobalOptions (...args) {
    configManager.setGlobalOptions(...args)
  }

  setAppOptions (...args) {
    configManager.setAppOptions(...args)
  }

  setServiceOptions (...args) {
    configManager.setServiceOptions(...args)
  }

  addService (...args) {
    serviceManager.addService(...args)
  }
}

export default new Stitch()
