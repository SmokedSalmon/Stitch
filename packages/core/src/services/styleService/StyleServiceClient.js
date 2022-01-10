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
  isStyleLoaded (styleName) {
    return this.#styleService.isStyleLoaded(this.#libName, styleName)
  }

  /**
   * @param {string} [styleName]
   * @param {object} [styleAttrs] - the html attributes of link elements
   * @return {Promise}
   */
  loadStyle (styleName, { styleAttrs } = {}) {
    if (styleName) {
      return this.#styleService.loadStyle(this.#libName, styleName, { styleAttrs })
    }

    return this.#styleService.loadAppStyles(this.#appName, { styleAttrs })
  }

  /**
   * @param {string} [styleName]
   */
  unloadStyle (styleName) {
    if (styleName) {
      this.#styleService.unloadStyle(this.#libName, styleName)
    }

    this.#styleService.unloadAppStyles(this.#appName)
  }
}

export default StyleServiceClient
