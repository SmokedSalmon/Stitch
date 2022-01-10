import config from './Config'
import RequiredServices from './RequiredServices'

export default class HostContext {
  /**
   * @param {'host' | 'app' | 'service'} type
   * @param {ManagedAppConfig.name | ManagedServiceConfig.name | Org.Product | string} targetName
   * @param {Array.<ManagedServiceConfig.name>} [requiredServices]
   */
  constructor (type, targetName, requiredServices) {
    this.targetName = targetName
    this.hostPath = 'TODO' // TODO using RouterService.getRouterMode to calculate the path before mfeConfig.routerPath
    this.config = config
    this.services = new RequiredServices(type, targetName, requiredServices)

    Object.freeze(this)
  }
}
