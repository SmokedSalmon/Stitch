import configManager from '../configManager'
import appManager from '../appManager'
import serviceManager from '../serviceManager'
import { APP_STATUS, STYLE_SERVICE } from '../constants'
import { globalState } from '../utils'
import log from '../utils/log'

/** @type {Object.<ManagedAppConfig.name, Array.<ManagedStyleConfig.name>>} */
const cachedAutoLoadStyles = {}

const unloadAutoLoadStyles = (appName) => {
  // directly using serviceManager, because hostContext.services depends on the require list
  const styleService = serviceManager.getServiceSync(STYLE_SERVICE)

  if (styleService) {
    const autoLoadStyles = cachedAutoLoadStyles[appName]

    if (autoLoadStyles.length) {
      const styleServiceClient = styleService.createClient('app', appName)

      autoLoadStyles.forEach((styleName) => {
        styleServiceClient.unloadStyle(styleName)
      })
    }
  }
}

/**
 * @param {ManagedAppConfig.name} appName
 * @return {Array.<ManagedStyleConfig.name>}
 */
const getAutoLoadStyles = (appName) => {
  return configManager.getAppConfig(appName).styles
    .filter((config) => config.autoLoad)
    .reduce((styleNames, config) => [
      ...styleNames,
      config.name
    ], [])
}

const loadAutoLoadStyles = (appName) => {
  // directly using serviceManager, because hostContext.services depends on the require list
  const styleService = serviceManager.getServiceSync(STYLE_SERVICE)

  if (styleService) {
    if (!cachedAutoLoadStyles[appName]) {
      cachedAutoLoadStyles[appName] = getAutoLoadStyles(appName)
    }

    const autoLoadStyles = cachedAutoLoadStyles[appName]

    if (autoLoadStyles.length) {
      const styleServiceClient = styleService.createClient('app', appName)

      autoLoadStyles.forEach((styleName) => {
        styleServiceClient.loadStyle(styleName)
      })
    }
  }
}

export const renderApp = (dom, appName) => {
  const logger = log.getLogger('renderApp')
  const lazyApp = appManager.getApp(appName)
  if (globalState.devMode) {
    logger.debug('----------Host Component is mounted----------', 'SC-O-1001')
    logger.debug(`App Name = "${appName}"`, 'SC-O-1002')
  }
  return lazyApp.then((instance) => {
    const handleAppMount = () => {
      loadAutoLoadStyles(appName)
    }

    if (instance && instance.mount) {
      handleAppMount()
      instance.mount(dom)
      appManager.setState(appName, APP_STATUS.Active)
    } else {
      logger.fatal('instance is missing mount method!', 'SC-P-5003')
      throw new Error('instance is missing mount method!')
    }
  }).catch((error) => {
    // we should test it out
    appManager.setState(appName, APP_STATUS.RunError)
    logger.error(error, 'SC-O-4001')
    // throw error---TODO cause UT error, investigating
  })
}

export const cleanApp = (dom, appName) => {
  const logger = log.getLogger('cleanApp')
  const lazyApp = appManager.getApp(appName)
  return lazyApp.then((instance) => {
    if (instance && instance.unmount) {
      const handleAppUnmount = () => {
        unloadAutoLoadStyles(appName)
      }

      instance.unmount(dom)
      handleAppUnmount()
      appManager.setState(appName, APP_STATUS.Inactive)
    } else {
      logger.fatal('instance is missing unmount method!', 'SC-P-5004')
      throw new Error('instance is missing unmount method!')
    }
  }).catch((error) => {
    appManager.setState(appName, APP_STATUS.RunError)
    logger.error(error, 'SC-O-4002')
    // throw error---TODO cause UT error, investigating
  })
}
