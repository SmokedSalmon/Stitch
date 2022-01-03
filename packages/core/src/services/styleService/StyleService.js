import { isMatch } from 'lodash'

import { MFEService } from '@stitch/types'

import StyleServiceClient from './StyleServiceClient'

const styleInjectionDom = window.document.head

const createLinkElement = (attributes) => {
  const styleTag = window.document.createElement('LINK')

  const {
    onload,
    onerror,
    ...rest
  } = attributes

  styleTag.onload = onload
  styleTag.onerror = onerror || onload

  if (!rest.rel) {
    rest.rel = 'stylesheet'
  }

  Object.keys(rest).forEach(key => {
    styleTag.setAttribute(key, rest[key])
  })

  return styleTag
}

const getInjectedStyle = (uniqueID) => styleInjectionDom.querySelector(`link[data-unique-id="${uniqueID}"]`)

// counts the reference count of each styles for removable checking
const referenceCount = {}

const loadStyleById = (uniqueID, href, { styleAttrs } = {}) => {
  if (getInjectedStyle(uniqueID)) {
    return Promise.reject(new Error(`The style (link[data-unique-id="${uniqueID}"]) has been injected`))
  }

  return new Promise((resolve, reject) => {
    styleInjectionDom.appendChild(createLinkElement({
      'data-unique-id': uniqueID,
      href,
      ...styleAttrs,
      onload (event) {
        if (referenceCount[uniqueID]) {
          referenceCount[uniqueID]++
        } else {
          referenceCount[uniqueID] = 1
        }

        resolve({ uniqueID, event })
      },
      onerror () {
        reject(new Error(`The style resource (uniqueID: ${uniqueID}) load failed`))
      }
    }))
  })
}

const unloadStyleById = (uniqueID) => {
  const style = getInjectedStyle(uniqueID)

  if (style && referenceCount[uniqueID] && referenceCount[uniqueID] <= 1) {
    styleInjectionDom.removeChild(style)
    referenceCount[uniqueID]--
  }
}

class StyleService extends MFEService {
  constructor () {
    super()
    Object.freeze(this)
  }

  createClient (type, name) {
    if (type === 'app' && name) {
      return new StyleServiceClient(this, this.hostContext.config.getAppConfig(name).libName, name)
    }

    return null
  }

  #getStyleUniqueID (libName, styleName) {
    const foundStyleConfig = this.hostContext.config.getStyleConfig(libName, styleName)

    if (foundStyleConfig.length > 0) {
      return foundStyleConfig[0].uniqueID
    }

    return console.error(`Not matched style of styleName: ${styleName} of libName: ${libName}`)
  }

  /**
   * @param {string} libName
   * @param {string} styleName
   * @return {boolean}
   */
  hasStyle (libName, styleName) {
    return !!getInjectedStyle(this.#getStyleUniqueID(libName, styleName))
  }

  /**
   * @param {string} libName
   * @param {string} styleName
   * @param {object} [styleAttrs] - the html attributes of link elements
   * @return {Promise}
   */
  loadStyle (libName, styleName, { styleAttrs } = {}) {
    const uniqueID = this.#getStyleUniqueID(libName, styleName)
    const href = this.hostContext.config.getStyleConfig(uniqueID)[0].styleUrl

    return loadStyleById(uniqueID, href, { styleAttrs })
  }

  /**
   * @param {string} libName
   * @param {string} styleName
   */
  unloadStyle (libName, styleName) {
    unloadStyleById(this.#getStyleUniqueID(libName, styleName))
  }

  /**
   * @typedef {object} InjectStyleParamOptions
   * @property {object | function} [filter]
   * @property {object} [styleAttrs] - the html attributes of link elements
   */

  /**
   * @param {string} appName
   * @param {InjectStyleParamOptions} [options]
   * @return {Promise.<Array>}
   */
  loadAppStyles (appName, options = {}) {
    const { styleAttrs } = options
    let { filter = config => config } = options

    if (typeof filter === 'object') {
      filter = config => isMatch(config, filter)
    }

    const loadAppStylesPromises = []

    this.hostContext.config.getAppConfig(appName).styles
      .filter(filter)
      .forEach(({ uniqueID }) => {
        const href = this.hostContext.config.getStyleConfig(uniqueID)[0].styleUrl
        loadAppStylesPromises.push(loadStyleById(uniqueID, href, { styleAttrs }))
      })

    return Promise.allSettled(loadAppStylesPromises)
  }

  /**
   * @param {string} appName
   * @param {InjectStyleParamOptions} [options]
   */
  unloadAppStyles (appName, options = {}) {
    let { filter = config => config } = options

    if (typeof filter === 'object') {
      filter = config => isMatch(config, filter)
    }

    this.hostContext.config.getAppConfig(appName).styles
      .filter(filter)
      .forEach(({ uniqueID }) => {
        unloadStyleById(uniqueID)
      })
  }
}

export default new StyleService()
