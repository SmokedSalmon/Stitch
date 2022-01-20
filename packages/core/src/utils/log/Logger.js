import logHandlers from './handlers'
import StitchError from './StitchError'

export default class Logger {
  #loggerName

  constructor (loggerName) {
    if (!loggerName) {
      loggerName = 'default'
      console.error('No category provided.')
    }
    this.#loggerName = loggerName
  }

  debug (...args) {
    if (!this.#validateArgs(args)) return
    const { code, message, error } = this.#convertArgs(args)
    this.#handleLog('debug', message, error, code)
  }

  info (...args) {
    if (!this.#validateArgs(args)) return
    const { code, message, error } = this.#convertArgs(args)
    this.#handleLog('info', message, error, code)
  }

  warn (...args) {
    if (!this.#validateArgs(args)) return
    const { code, message, error } = this.#convertArgs(args)
    this.#handleLog('warn', message, error, code)
  }

  error (...args) {
    if (!this.#validateArgs(args)) return
    const { code, message, error } = this.#convertArgs(args)
    this.#handleLog('error', message, error, code)
  }

  fatal (...args) {
    if (!this.#validateArgs(args)) return
    const { code, message, error } = this.#convertArgs(args)
    this.#handleLog('fatal', message, error, code)
  }

  #validateArgs (args) {
    if (!args) {
      console.error('no arguments')
      return false
    }
    if (args.length < 2) {
      console.error('arguments count is less than 2')
      return false
    }
    if (typeof args[0] !== 'string' && !(args[0] instanceof Error)) {
      console.error('incorrect message type or Error type')
      return false
    }
    if (typeof args[1] !== 'string') {
      console.error('incorrect error code type')
      return false
    }
    if (args.length > 2) {
      console.warn('arguments count is greater than 3')
    }
    return true
  }

  #convertArgs (args) {
    const code = args[1]
    let message = null
    let error = null
    if (typeof args[0] === 'string') {
      message = args[0]
    }
    if (args[0] instanceof Error) {
      error = args[0]
    }
    return {
      code,
      message,
      error
    }
  }

  #handleLog (level, message, error, code) {
    if (!logHandlers) {
      console.error('no logHandlers found')
      return
    }
    if (typeof logHandlers[level] !== 'function') {
      console.error(`the level: ${level} of the log handler is not a function`)
      return
    }
    logHandlers[level](new StitchError(this.#loggerName, ...arguments))
  }
}
