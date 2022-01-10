import appManager from '../appManager'
import serviceManager from '../serviceManager'
import { APP_STATUS, STYLE_SERVICE } from '../constants'
import globalState from '../utils/globalState'

/**
 * @param {HostContext} hostContext
 * @return {Array.<StyleConfig.name>}
 */
const getAutoLoadStyles = (hostContext) => {
  return hostContext.config.getStyleConfig(hostContext.config.getAppConfig(hostContext.targetName).libName)
    .filter((config) => config.autoLoad)
    .reduce((styleNames, config) => [
      ...styleNames,
      config.name
    ], [])
}

const loadAutoLoadStyles = (hostCtx, name) => {
  // directly using serviceManager, because hostContext.services depends on the require list
  const styleService = serviceManager.getService(STYLE_SERVICE)

  if (styleService) {
    const autoLoadStyles = getAutoLoadStyles(hostCtx)

    if (autoLoadStyles.length) {
      const styleServiceClient = styleService.createClient('app', name)

      autoLoadStyles.forEach((styleName) => {
        styleServiceClient.loadStyle(styleName)
      })
    }
  }
}

const unloadAutoLoadStyles = (hostCtx, name) => {
  // directly using serviceManager, because hostContext.services depends on the require list
  const styleService = serviceManager.getService(STYLE_SERVICE)

  if (styleService) {
    const autoLoadStyles = getAutoLoadStyles(hostCtx)

    if (autoLoadStyles.length) {
      const styleServiceClient = styleService.createClient('app', name)

      autoLoadStyles.forEach((styleName) => {
        styleServiceClient.unloadStyle(styleName)
      })
    }
  }
}

export const renderApp = (dom, appName) => {
  const lazyApp = appManager.getApp(appName)
  if (globalState.devMode) {
    console.log('----------Host Component is mounted----------')
    console.log(`App Name = "${appName}"`)
  }
  return lazyApp.then((instance) => {
    const hostContext = appManager.getHostContext(appName)
    const handleAppMount = () => {
      loadAutoLoadStyles(hostContext, appName)
    }

    if (instance && instance.mount) {
      instance.mount(dom)
      handleAppMount()
      appManager.setState(appName, APP_STATUS.Active)
    }
  }).catch((error) => {
    console.error(error)
  })
}

export const cleanApp = (dom, appName) => {
  const lazyApp = appManager.getApp(appName)
  return lazyApp.then((instance) => {
    if (instance) {
      const hostContext = appManager.getHostContext(appName)
      const handleAppUnmount = () => {
        unloadAutoLoadStyles(hostContext, appName)
      }

      if (instance) {
        instance.unmount(dom)
        handleAppUnmount()
      }
      appManager.setState(appName, APP_STATUS.Inactive)
    }
    if (globalState.devMode) {
      console.log('----------Host Component is unmounted----------')
    }
  }).catch((error) => {
    console.error(error)
  })
}
