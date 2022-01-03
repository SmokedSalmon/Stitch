class MessageServiceClient {
  #messageService
  #ownName

  constructor (messageService, name) {
    this.#messageService = messageService
    this.#ownName = name || ''

    Object.freeze(this)
  }

  post (...args) {
    return this.#messageService.post(this.#ownName, ...args)
  }

  send (...args) {
    return this.#messageService.send(this.#ownName, ...args)
  }

  hasTopic (topic) {
    return this.#messageService.hasTopic(topic)
  }

  sub (...args) {
    return this.#messageService.sub(...args)
  }

  unsub (...args) {
    return this.#messageService.unsub(...args)
  }
}

export default MessageServiceClient
