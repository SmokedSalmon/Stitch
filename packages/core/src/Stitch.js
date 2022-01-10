import appManager from './appManager'
import configManager from './configManager'
import serviceManager, { SERVICE_TYPE_LIB, SERVICE_AUTOLOAD, SERVICE_TYPE_SYSTEM } from './serviceManager'
import { globalState } from './utils'

class Stitch {
  #state

  constructor () {
    this.#state = globalState

    Object.freeze(this)
  }

  config (config, { history }) {
    configManager.updateConfig(config)

    if (!history) {
      console.warn('Please provide a history instance for Stitch if you want to enable router Service.')
    }

    this.#state.history = history
  }

  start () {
    if (this.#state.stitchStart) {
      throw new Error('The Stitch has been started.')
    }

    return serviceManager.getServices({ type: SERVICE_TYPE_LIB, [SERVICE_AUTOLOAD]: true })
      .then(() => {
        this.#state.stitchStart = true

        // start all prioritized/critical services
        serviceManager.startAllServices()

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
