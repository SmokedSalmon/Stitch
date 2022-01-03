class GlobalState {
  #configEnv
  #stitchStart
  #router // TODO remove

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

  /** @deprecated TODO remove */
  get router () {
    return this.#router
  }

  /** @deprecated TODO remove */
  set router (value) {
    this.#router = value
  }
}

export default new GlobalState()
