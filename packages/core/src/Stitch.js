import appManager from './appManager'
import configManager from './configManager'
import serviceManager, { SERVICE_TYPE_LIB, SERVICE_AUTOLOAD } from './serviceManager'
import { globalState, log } from './utils'

class Stitch {
  #state
  #logger

  constructor () {
    this.#state = globalState
    this.#logger = log.getLogger('Stitch')
    Object.freeze(this)
  }

  #checkStitchStarted () {
    if (!this.#state.stitchStart) {
      this.#logger.error('The Stitch has not started.', 'SC-P-4003')
      return false
    }
    return true
  }

  #checkConfigReady () {
    if (!this.#state.configReady) {
      this.#logger.error('The Stitch config has not been set.', 'SC-P-4004')
      return false
    }
    return true
  }

  config (config, router) {
    try {
      configManager.updateConfig(config)
    } catch (error) {
      this.#logger.fatal(error, 'SC-P-5001')
    }

    this.#state.configReady = true

    if (!router || !router.history) {
      this.#logger.warn('Please provide a history instance for Stitch if you want to enable router Service.', 'SC-P-3001')
    }

    this.#state.history = router && router.history
  }

  start () {
    if (this.#state.stitchStart) {
      this.#logger.warn('The Stitch has been started.', 'SC-O-3002')
      return
    }

    return serviceManager.getServices({ type: SERVICE_TYPE_LIB, [SERVICE_AUTOLOAD]: true })
      .then(() => {
        // [TODO](next Sprint) move this indicator after .startAllServices().then(() => {})
        this.#state.stitchStart = true

        // start all prioritized/critical services
        return serviceManager.startAllServices()
      }).catch((err) => {
        this.#state.stitchStart = false
        const stitchStartError = new Error('The Stitch start fail.')
        this.#logger.fatal(stitchStartError, 'SC-O-5002')
        this.#logger.debug(err, '')
        throw stitchStartError
      })
  };

  /**
   * Pupup console UI. Only take effect in dev mode.
   */
  showConsoleUI () {
    this.#checkConfigReady()

    if (this.#state.devMode) {
      // TODO
    }
  };

  /**
   * Close console UI. Only take effect in dev mode.
   */
  hideConsoleUI () {
    this.#checkConfigReady()

    if (this.#state.devMode) {
      // TODO
    }
  };

  getAppManager () {
    return this.#checkStitchStarted() ? appManager : null
  };

  getConfigManager () {
    return this.#checkConfigReady() ? configManager : null
  }

  getServiceManager () {
    return this.#checkStitchStarted() ? serviceManager : null
  }

  setGlobalOptions (...args) {
    if (this.#checkConfigReady()) { configManager.setGlobalOptions(...args) }
  }

  setAppOptions (...args) {
    if (this.#checkConfigReady()) { configManager.setAppOptions(...args) }
  }

  setServiceOptions (...args) {
    if (this.#checkConfigReady()) { configManager.setServiceOptions(...args) }
  }

  addService (...args) {
    if (this.#checkConfigReady()) { serviceManager.addService(...args) }
  }
}

export default new Stitch()
