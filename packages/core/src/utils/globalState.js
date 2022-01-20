class GlobalState {
  #configEnv // default value depends on the schema
  #stitchStart = false
  #configReady = false
  #history

  constructor () {
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

  get configReady () {
    return this.#configReady
  }

  set configReady (value) {
    this.#configReady = !!value
  }

  get history () {
    return this.#history
  }

  set history (value) {
    this.#history = value
  }
}

export default new GlobalState()
