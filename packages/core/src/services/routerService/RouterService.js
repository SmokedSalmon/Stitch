import { MFEService } from '@stitch/types'

import RouterAdaptorHistoryV5, { RouterAdaptorHistoryV4 } from './RouterAdaptor'
import configManager from '../../configManager'
import NavPrompt from './NavPrompt'
import { log } from '../../utils'

// this is router service factory
class RouterService extends MFEService {
  #logger = log.getLogger('RouterService')

  history
  navPrompt

  constructor ({ adaptor, customNavPrompt }, cusHistory) {
    super()

    if (typeof adaptor === 'string' && cusHistory) {
      // we expect "HistoryV4" or "HistoryV5"
      switch (adaptor) {
        case 'HistoryV4':
          this.history = new RouterAdaptorHistoryV4(cusHistory)
          break
        case 'HistoryV5':
          this.history = new RouterAdaptorHistoryV5(cusHistory)
          break
        default:
      }
    }

    if (typeof adaptor === 'object') {
      if (
        adaptor.action &&
        adaptor.location &&
        adaptor.push &&
        adaptor.replace &&
        adaptor.go &&
        adaptor.back &&
        adaptor.forward &&
        adaptor.block &&
        adaptor.listen
      ) {
        this.history = adaptor
      } else {
        this.#logger.error('You are passing a incorrect adaptor, you should pass a RouterAdaptor instance.', 'RS-P-4001')
      }
    }

    if (this.history) {
      this.navPrompt = new NavPrompt(this.history)

      if (customNavPrompt && this.navPrompt) {
        this.navPrompt.useCustomizedUI(customNavPrompt)
      }
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

  /**
   * @return {'hash' | 'browser'}
   */
  getRouterMode () {
    if (this.history) {
      return (window.location.hash.indexOf(`#${this.history.location.pathname}`) === 0) ? 'hash' : 'browser'
    }

    return 'browser'
  }
}

export default RouterService
