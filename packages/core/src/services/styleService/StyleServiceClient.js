class StyleServiceClient {
  #styleService
  #appName
  #libName

  constructor (styleService, libName, appName) {
    this.#styleService = styleService
    this.#appName = appName
    this.#libName = libName

    Object.freeze(this)
  }

  /**
   * @param {string} styleName
   * @return {boolean}
   */
  hasStyle (styleName) {
    return this.#styleService.hasStyle(this.#libName, styleName)
  }

  /**
   * @param {string | null} styleName
   * @param {InjectStyleParamOptions} [options]
   * @return {Promise}
   */
  loadStyle (styleName, options) {
    if (styleName) {
      return this.#styleService.loadStyle(this.#libName, styleName, options.styleAttrs)
    }

    return this.#styleService.loadAppStyles(this.#appName, options)
  }

  /**
   * @param {string | null} styleName
   * @param {InjectStyleParamOptions} [options]
   */
  unloadStyle (styleName, options) {
    if (styleName) {
      this.#styleService.unloadStyle(this.#libName, styleName)
    }

    this.#styleService.unloadAppStyles(this.#appName, options)
  }
}

export default StyleServiceClient
