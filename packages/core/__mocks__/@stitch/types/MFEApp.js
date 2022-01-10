/**
 * copy from @stitch/types/src/MFEApp.ts
 * @abstract
 */
export default class MFEApp {
  #hostContext

  /** @protected */
  constructor () {
    if (new.target === MFEApp) {
      throw new TypeError('Cannot construct abstract class MFEApp instances directly')
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

  init (hostContext) {
    this.#hostContext = hostContext
  }

  /** @abstract */
  mount (dom) {
    throw new TypeError('MFEApp abstract member mount() is not implemented')
  }

  /** @abstract */
  unmount (dom) {
    throw new TypeError('MFEApp abstract member unmount() is not implemented')
  }
}
