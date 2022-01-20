
/**
 * @typedef {MessageServiceClient | StyleServiceClient} SystemServiceClient
 */

/**
 * @typedef {SystemService | SystemServiceClient | Object.<LibService> | Object.<CustomizedService>} HostContextAvailableService
 */
import { log } from '../utils'

export default class RequiredServices {
  #type
  #targetName
  #serviceCache = {}
  #logger

  constructor (type, targetName, requiredServices) {
    this.#type = type
    this.#targetName = targetName
    this.#logger = log.getLogger('RequiredServices')

    this.#bindContextServices(requiredServices)

    Object.freeze(this)
  }

  /**
   * Bind the available services to an MFE applications host context
   * If bound, instances of the same service are unique between MFE applications.
   * If the service is a singleton, all MFE applications shared the same reference
   * @param {Array.<string>} requiredServices
   */
  #bindContextServices (requiredServices) {
    // create shortcut of services by MFEApp.require() or MFEService.require()
    if (requiredServices instanceof Array) {
      requiredServices.forEach(({ name, service }) => {
        this.#serviceCache[name] = service
        Object.defineProperty(this, name, {
          get () {
            return this.#serviceCache[name]
          }
        })
      })
    }
  }

  /**
   * Get specified available service bound in current MFE application HostContext.
   * @param {string} name
   * @return {HostContextAvailableService | null}
   */
  getService (name) {
    const service = this.#serviceCache[name]

    if (!service) {
      if (this.#targetName) {
        this.#logger.warn(`Service '${name}' is not available under MFEApp/MFEService '${this.#targetName}'`, 'SC-O-3003')
      }
      return null
    }

    return service
  }
}
