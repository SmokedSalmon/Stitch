import { MFEService } from '@stitch/types'

import StyleServiceClient from './StyleServiceClient'
import { log } from '../../utils'

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
  const logger = log.getLogger('loadStyleById')

  if (getInjectedStyle(uniqueID)) {
    const styleInjectError = new Error(`The style (link[data-unique-id="${uniqueID}"]) has been injected`)

    logger.error(styleInjectError, 'SS-O-4001')

    return Promise.reject(styleInjectError)
  }

  return new Promise((resolve, reject) => {
    try {
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

          /**
           * @typedef {object} LoadStyleResult
           * @property {string} uniqueID
           * @property {object} event
           */
          resolve({ uniqueID, event })
        },
        onerror () {
          const styleLoadError = new Error(`The style resource (uniqueID: ${uniqueID}) load failed`)

          logger.error(styleLoadError, 'SS-N-4001')

          reject(styleLoadError)
        }
      }))
    } catch (error) {
      logger.error(error, 'SS-O-4002')

      reject(error)
    }
  })
}

const unloadStyleById = (uniqueID) => {
  const logger = log.getLogger('unloadStyleById')
  const style = getInjectedStyle(uniqueID)

  if (style && referenceCount[uniqueID] && referenceCount[uniqueID] <= 1) {
    try {
      styleInjectionDom.removeChild(style)
      referenceCount[uniqueID]--
    } catch (error) {
      logger.error(error, 'SS-O-4003')
    }
  }
}

class StyleService extends MFEService {
  #logger = log.getLogger('StyleService')

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

    this.#logger.error(`Not matched style of styleName: ${styleName} of libName: ${libName}`, 'SS-O-4004')

    return null
  }

  /**
   * @param {string} libName
   * @param {string} styleName
   * @return {boolean}
   */
  isStyleLoaded (libName, styleName) {
    return !!getInjectedStyle(this.#getStyleUniqueID(libName, styleName))
  }

  /**
   * @param {string} libName
   * @param {string} styleName
   * @param {object} [styleAttrs] - the html attributes of link elements
   * @return {Promise.<LoadStyleResult>}
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
   * @param {string} appName
   * @param {object} [styleAttrs] - the html attributes of link elements
   * @return {Promise.<Array.<LoadStyleResult>>}
   */
  loadAppStyles (appName, { styleAttrs } = {}) {
    const loadAppStylesPromises = []

    this.hostContext.config.getAppConfig(appName).styles
      .forEach(({ uniqueID }) => {
        const href = this.hostContext.config.getStyleConfig(uniqueID)[0].styleUrl
        loadAppStylesPromises.push(loadStyleById(uniqueID, href, { styleAttrs }))
      })

    return Promise.allSettled(loadAppStylesPromises)
  }

  /**
   * @param {string} appName
   */
  unloadAppStyles (appName) {
    this.hostContext.config.getAppConfig(appName).styles
      .forEach(({ uniqueID }) => {
        unloadStyleById(uniqueID)
      })
  }
}

export default new StyleService()
