class GlobalState {
  #configEnv
  #stitchStart
  #history

  constructor () {
    // this.#configEnv = 'Prod' // default value depends on the schema
    this.#stitchStart = false

    Object.freeze(this)
  }

  get configEnv () {
    return this.#configEnv
  }

  set configEnv (value) {
    this.#configEnv = value
  }

  get devMode () {
    return this.#configEnv === 'Dev'
  }

  get stitchStart () {
    return this.#stitchStart
  }

  set stitchStart (value) {
    this.#stitchStart = !!value
  }

  get history () {
    return this.#history
  }

  set history (value) {
    this.#history = value
  }
}

export default new GlobalState()
