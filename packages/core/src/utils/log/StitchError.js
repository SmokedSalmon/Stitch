export default class StitchError {
  #code
  #level
  #loggerName
  #message
  #error
  #timestamp

  constructor (loggerName, level, message, error, code) {
    this.#code = code
    this.#level = level
    this.#loggerName = loggerName
    this.#message = message
    this.#error = error
    this.#timestamp = Date.now()
  }

  get code () {
    return this.#code
  }

  get level () {
    return this.#level
  }

  get loggerName () {
    return this.#loggerName
  }

  get message () {
    return this.#message
  }

  get error () {
    return this.#error
  }

  get timestamp () {
    return this.#timestamp
  }

  get value () {
    return {
      code: this.#code,
      level: this.#level,
      loggerName: this.#loggerName,
      message: this.#message,
      error: this.#error,
      timestamp: this.#timestamp
    }
  }
}
