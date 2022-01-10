/**
 * copy from @stitch/types/src/MFEService.ts
 * @abstract
 */
export default class MFEService {
  #status = 'stopped'
  #hostContext

  /** @protected */
  constructor () {
    if (new.target === MFEService) {
      throw new TypeError('Cannot construct abstract class MFEService instances directly')
    }
  }

  get hostContext () {
    return this.#hostContext
  }

  /** @protected */
  set hostContext (value) {
    this.#hostContext = value
  }

  require () {
    return []
  }

  start (hostContext) {
    this.#status = 'starting'
    this.#hostContext = hostContext

    return Promise.resolve()
      .then(() => {
        this.#status = 'started'
      })
  }

  stop () {
    this.#status = 'stopped'
}

  getStatus () {
    return this.#status
  }

  /** @protected */
  setStatus (value) {
    this.#status = value
}

  createClient (type = 'host', name) {
    return null
  }
}
