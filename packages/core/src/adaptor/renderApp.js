import appManager from '../appManager'
import serviceManager from '../serviceManager'
import { APP_STATUS, STYLE_SERVICE } from '../constants'

export const renderApp = (dom, appName) => {
  const lazyApp = appManager.getApp(appName)
  console.log('----------Host Component is mounted----------')
  console.log(`App Name = "${appName}"`)
  return lazyApp.then((app) => {
    let {
      config,
      instance,
      state,
      /** @type {HostContext} */
      hostContext
    } = app
    const handleAppMount = () => {
      // directly using serviceManager, because hostContext.services depends on the require list
      const styleService = serviceManager.getService(STYLE_SERVICE)

      if (styleService) {
        styleService.createClient('app', appName).loadStyle(null, { filter: { autoLoad: true } })
      }
    }

    if (config && instance) {
      if (state !== APP_STATUS.Initialized) {
        instance.init(hostContext)
        state = APP_STATUS.Initialized // 'initialized'
      }
      instance.mount(dom)
      handleAppMount()
      state = APP_STATUS.Active // 'mounted'
    }
  }).catch((error) => {
    console.error(error)
  })
}

export const cleanApp = (dom, appName) => {
  const lazyApp = appManager.getApp(appName)
  return lazyApp.then((app) => {
    if (app) {
      let {
        config,
        instance,
        state
      } = app
      const handleAppUnmount = () => {
        const styleService = serviceManager.getService(STYLE_SERVICE)

        if (styleService) {
          styleService.createClient('app', appName).unloadStyle(null, { filter: { autoLoad: true } })
        }
      }

      if (config && instance) {
        instance.unmount(dom)
        handleAppUnmount()
      }
      // eslint-disable-next-line no-unused-vars
      state = APP_STATUS.Inactive// 'unmounted'
    }
    console.log('----------Host Component is unmounted----------')
  }).catch((error) => {
    console.error(error)
  })
}
