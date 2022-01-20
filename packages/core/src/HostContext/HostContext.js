import config from './Config'
import RequiredServices from './RequiredServices'
import configManager from '../configManager'

const getHostPath = (routerMode, routerPath) => {
  switch (routerMode) {
    case 'hash':
    case 'browser': {
      const {
        location: { href, protocol, host, pathname }
      } = window

      if (href.indexOf(routerPath) > 0) {
        return href.substr(protocol.length, href.indexOf(routerPath) - routerPath.length - 2)
      }

      return '//' + host + pathname
    }
    default:
      throw new Error(`Unsupported routerMode: '${routerMode}'`)
  }
}

export default class HostContext {
  /**
   * @param {'hash' | 'browser'} routerMode
   * @param {'host' | 'app' | 'service'} type
   * @param {ManagedAppConfig.name | ManagedServiceConfig.name | Org.Product | string} targetName
   * @param {Array.<ManagedServiceConfig.name>} [requiredServices]
   */
  constructor (routerMode, type, targetName, requiredServices) {
    this.targetName = targetName
    this.hostPath = getHostPath(routerMode, configManager.getRouterPath())
    this.config = config
    this.services = new RequiredServices(type, targetName, requiredServices)

    Object.freeze(this)
  }
}
