import { ROUTER_MODE_BROWSER, ROUTER_MODE_HASH } from '../../constants'
import { log } from '../../utils'

const emptyFunc = () => {}

/** @type NavPromptOptions */
const DEFAULT_OPTIONS = {
  mode: ROUTER_MODE_HASH,
  interceptUntouched: true, // default to intercept despite of page is dirty or not
  test: undefined,
  prompt: {
    title: 'Content is unsaved',
    message: 'Are you sure to leave the page',
    cancelText: 'Cancel',
    confirmText: 'Confirm'
  },
  onInit: emptyFunc,
  onConfirm: emptyFunc,
  onCancel: emptyFunc
}

/**
 * Check if the current options are valid to operate on
 * @param {NavPromptOptions} options
 */
function validateOptions (options) {
  if (!options) return false
  const { mode, test } = options
  if (![ROUTER_MODE_BROWSER, ROUTER_MODE_HASH].includes(mode)) return false
  if (!test || !(['function', 'string'].includes(typeof test) || test instanceof RegExp)) return false
  return true
}

class NavPrompt {
  #onConfirm
  #onCancel
  #stop
  #options
  #unblock
  #showConfirmModal
  #hideConfirmModal
  #history
  #logger = log.getLogger('NavPrompt')

  constructor (history) {
    // this.uniqueId = `nav-prompt-${Math.random().toString(32).substr(2)}`
    this.dirty = false
    this.#onConfirm = emptyFunc
    this.#onCancel = emptyFunc
    this.#stop = emptyFunc
    /** @type NavPromptOptions */
    this.#options = { ...DEFAULT_OPTIONS }
    this.#unblock = undefined
    this.#showConfirmModal = undefined
    this.#hideConfirmModal = undefined
    this.#history = history
  }

  /**
   * Configure the options for Exit Service controller
   * @private
   * @param {NavPromptOptions} options
   */
  configure (options = {}) {
    if (!options) {
      this.#logger.warn('You must provide options', 'RS-P-4101')
      return
    }
    // clear previous working Exit Service
    this.cleanUp()

    this.#options = {
      ...DEFAULT_OPTIONS,
      ...options,
      prompt: { ...DEFAULT_OPTIONS.prompt, ...options.prompt }
    }
  }

  get getOptions () {
    return { ...this.#options }
  }

  get prompt () {
    return { ...this.#options.prompt }
  }

  /**
 * Check if the given UI information are sufficient
 * @param {Customized_UI_Object|NavPrompt} uiObject
 */
  #validateCustomizeUI (uiObject = {}) {
    const { show, hide } = uiObject
    if (typeof show === 'function' && typeof hide === 'function') return true
    this.#logger.error('Insufficient handlers are provided to NavPrompt, you must provided both "show" & "hide" handlers for the customized UI', 'RS-P-4109')
    return false
  }

  /**
   * Set customized UI globally
   * @param {Customized_UI_Object} uiObject
   */
  useCustomizedUI (uiObject) {
    // validate the customized UI elements (handlers & other properties) are provided
    if (!this.#validateCustomizeUI(uiObject)) {
      this.#logger.warn("Fallback to browser's confirm prompt", 'RS-P-4101')
      return
    }
    this.#showConfirmModal = uiObject.show
    this.#hideConfirmModal = uiObject.hide
  }

  /**
   * Inform that page content has been change and Exit Service should be in-effect now
   */
  setDirty (flag = true) {
    this.dirty = flag
  }

  /**
   * Clear the page's dirty flag, and Exit Service should be turned-off until page content is touched again
   */
  clearDirty () {
    this.dirty = false
  }

  /**
   * Externalized handler for user confirming the leave
   * @property {Event} [e]
   */
  onConfirm = (e) => {
    if ((e && !e.isTrusted) || typeof this.#onConfirm !== 'function') return
    this.#onConfirm()
  }

  /**
   * Externalized handler for user cancelling/rejecting the leave
   * @property {Event} [e]
   */
  onCancel = (e) => {
    if ((e && !e.isTrusted) || typeof this.#onCancel !== 'function') return
    this.#onCancel()
  }

  /**
   * Flush the existing setting, clear any hooks and handler and re-set them all
   * @property {NavPromptOptions} [options]
   */
  start (options) {
    if (!window) {
      this.#logger.warn('Exit Service currently does NOT support non-browser environment, it will NOT take any effect', 'RS-P-4102')

      return
    }

    if (!this.#history) {
      this.#logger.warn("'history' instance used by main application must be provided", 'RS-P-4103')

      return
    }

    if (options) this.configure(options)

    if (!validateOptions(this.#options)) {
      this.#logger.warn('Trying to start exit service without valid options, it will NOT take any effect', 'RS-P-4104')

      return
    }

    const useCustomizedUI = this.#validateCustomizeUI({
      show: this.#showConfirmModal,
      hide: this.#hideConfirmModal
    })
    // clear previous working Exit Service
    this.cleanUp()

    // Begin to block router change
    this.#unblock = this.#history.block((targetLocation, action) => {
      // page content not touched, no need to intercept leave action. Unless it is also required to interept in the config
      if (!this.#options.interceptUntouched && !this.dirty) return true

      const { pathname, state, search } = targetLocation || {}
      let isLeavingAction = false
      switch (typeof this.#options.test) {
        case 'string':
          isLeavingAction = pathname !== this.#options.test
          break
        case 'function':
          isLeavingAction = !this.#options.test(pathname)
          break
        default:
          try {
            isLeavingAction = !this.#options.test.test(pathname)
          } catch (err) { /* do nothing, default to treat it as leaving */ }
      }

      // if not considered a leaving action, it is not blocked
      if (!isLeavingAction) return true

      // blocking router change and pending user input
      if (typeof this.#options.onInit === 'function') this.#options.onInit()
      new Promise((resolve, reject) => {
        if (useCustomizedUI) {
          this.#showConfirmModal()
          this.#onConfirm = () => {
            this.#hideConfirmModal()
            resolve(true)
          }
          this.#onCancel = () => {
            this.#hideConfirmModal()
            resolve(false)
          }
        } else {
          resolve(window.confirm(this.#options.prompt.message))
        }
      }).then(
        (isLeaving) => {
          if (isLeaving) {
            // user confirm it and we will leave the page
            if (typeof this.#unblock === 'function') this.#unblock()
            if (typeof this.#options.onConfirm === 'function') this.#options.onConfirm()
            this.cleanUp()
            switch (action) {
              case 'POP':
                this.#history.replace({ pathname, state, search })
                break
              case 'REPLACE':
                this.#history.replace({ pathname, state, search })
                break
              case 'PUSH':
              default:
                this.#history.push({ pathname, state, search })
                break
            }
          } else {
            // user cancel it and we will stay on the current page
            (typeof this.#options.onCancel === 'function') && this.#options.onCancel()
          }
        },
        (err) => {
          // unexpected redirection error
          this.#logger.warn('Staying the page due to some redirect exception', 'RS-P-4105')
          this.#logger.warn(err, 'RS-P-4106')

          if (typeof this.#options.onCancel === 'function') this.#options.onCancel()
        }
      )
      return false
    })

    // construct the stop callback to terminate current NavPrompt
    this.#stop = () => {
      if (typeof this.#unblock === 'function') this.#unblock()
      this.cleanUp()
    }
    return this.#stop
  }

  /**
   * Clearing up event handlers & hooks, and stops the Exit service
   */
  cleanUp () {
    if (!window) {
      this.#logger.warn('Exit Service currently does NOT support non-browser environment, it will NOT take any effect', 'RS-P-4105')

      return
    }
    this.clearDirty()
    this.#unblock = undefined
  }

  /**
   * Manually stops Nav Prompt.
   * Recommend to use the returned method of `start()` instead.
   * However, sometimes the the stop action performs in a different scope than where `start()` executed.
   */
  stop () {
    this.#stop()
  }
}

export default NavPrompt

/**
 * @typedef {Object} PromptDef
 * @property {string} title
 * @property {string} message
 * @property {string} cancelText
 * @property {string} confirmText
 */

/**
 * @typedef {Object} NavPromptOptions
 * @property {string} mode
 * @property {boolean} [interceptUntouched] - set true to intercept leaving action even for untouched pages
 * @property {string|RegExp|function} [test] - rule to determine whether a given path is considered NOT leaving/exiting
 * @property {PromptDef} prompt - prompt texts
 * @property {function} [onInit] - hook when NavPrompt triggered
 * @property {function} [onConfirm] - hook when user confirms leaving
 * @property {function} [onCancel] - hook when user cancels leaving
 */

/**
 * @typedef {Object} Customized_UI_Object
 * @property {function} show - show the UI
 * @property {function} hide - hide the UI
 */
