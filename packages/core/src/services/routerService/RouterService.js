import RouterAdaptor, { RouterAdaptorHistoryV4 } from './RouterAdaptor'
import { MFEService } from '@stitch/types'
import configManager from '../../configManager'

// this is router service factory
class RouterService extends MFEService {
  history;
  navPrompt;

  constructor ({ adaptor, customNavPrompt }, cusHistory) {
    super()

    // we expect "HistoryV4" or "HistoryV5"
    switch (adaptor) {
      case 'HistoryV4':
        this.history = new RouterAdaptorHistoryV4(cusHistory)
        this.navPrompt = this.history.navPrompt
        break
      case 'HistoryV5':
        this.history = new RouterAdaptor(cusHistory)
        this.navPrompt = this.history.navPrompt
        break
      default:
        if (adaptor instanceof RouterAdaptor) {
          this.history = adaptor
          this.navPrompt = this.history.navPrompt
        } else {
          console.error('You are passing a incorrect adaptor, you should pass a RouterAdaptor instance.')
          return this
        }
        break
    }
    if (customNavPrompt && this.navPrompt) {
      this.navPrompt.useCustomizedUI(customNavPrompt)
    }
    Object.freeze(this)
  }

  /**
   * @param {*} appName app name
   * @param {*} path example: /detail, if you don't have path, pass null is ok
   */
  pushApp (appName, path, state) {
    let targetPath = configManager.getAppConfig(appName).routerName[0]
    if (path) {
      targetPath += path
    }
    this.history.push(`/${configManager.getRouterPath}/${targetPath}`, state)
  }

  /**
   * @param {*} appName app name
   * @param {*} path example: /detail, if you don't have path, pass null is ok
   */
  replaceApp (appName, path, state) {
    let targetPath = configManager.getAppConfig(appName).routerName[0]
    if (path) {
      targetPath += path
    }
    this.history.replace(`/${configManager.getRouterPath}/${targetPath}`, state)
  }

  getRouterMode () {
    return (window.location.hash.indexOf(`#${history.location.pathname}`) === 0) ? 'hash' : 'browser'
  }
}

export default RouterService
