import { cloneDeep } from 'lodash'

import configManager from '../configManager'

class Config {
  constructor () {
    Object.freeze(this)
  }

  getRawConfig () {
    return cloneDeep(configManager.getRawConfig())
  }

  getOrgConfig () {
    return cloneDeep(configManager.getOrgConfig())
  }

  getEnv () {
    return configManager.getEnv()
  }

  getRouterPath () {
    return configManager.getRouterPath()
  }

  getGlobalOptions () {
    return cloneDeep(configManager.getGlobalOptions())
  }

  /**
   * @param {string} appName
   * @return {AppConfig}
   */
  getAppConfig (appName) {
    return cloneDeep(configManager.getAppConfig(appName))
  }

  /**
   * @param {string} serviceName
   * @return {ServiceConfig}
   */
  getServiceConfig (serviceName) {
    return cloneDeep(configManager.getServiceConfig(serviceName))
  }

  /**
   * @param {string} libName - when passed as value of style config uniqueID, will return the matched style config directly
   * @param {string} [styleName]
   * @return {Array.<StyleConfig>}
   */
  getStyleConfig (libName, styleName) {
    return cloneDeep(configManager.getStyleConfig(libName, styleName))
  }
}

// export static singleton for reduce memory
export default new Config()
