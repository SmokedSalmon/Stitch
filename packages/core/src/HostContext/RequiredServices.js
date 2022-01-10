
/**
 * @typedef {MessageServiceClient | StyleServiceClient} SystemServiceClient
 */

/**
 * @typedef {SystemService | SystemServiceClient | Object.<LibService> | Object.<CustomizedService>} HostContextAvailableService
 */

export default class RequiredServices {
  #type
  #targetName
  #serviceCache = {}

  constructor (type, targetName, requiredServices) {
    this.#type = type
    this.#targetName = targetName

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
      requiredServices.forEach(({name, service}) => {
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
        console.warn(`Service '${name}' is not available under MFEApp/MFEService '${this.#targetName}'`)
      }
      return null
    }

    return service
  }
}
