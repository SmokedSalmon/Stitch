import { MFEService } from '@stitch/types'

import MessageServiceClient from './MessageServiceClient'

const POST = 'Post'
const SEND = 'Send'
const FIRST = 'First'
const ALL = 'All'
const SUCCESS = 'Success'
const FAILED = 'Failed'

const verifyTopicArg = (topic) => {
  if (!topic) {
    throw new Error('the topic arg must be exist')
  }
  if (topic && typeof topic !== 'string') {
    throw new Error('the topic arg must be a string')
  }
}

/**
   * format message object
   * @function
   * @alias communicateWithOther
   * @param { String } type 'Post' | 'Send'
   * @param { String } policy 'First' | 'All'
   * @param { String } topic
   * @param { String } sender Sender name. The MFE App name or 'Stitch' or channel's Main App name
   * @param { String } status 'Success' | 'Failed'
   * @param { Object } data The data to pass to subscribers
   * @return { Object } Message
   */
const packMessage = (type, policy, topic, sender, status, data) => ({
  topic,
  type,
  policy,
  time: Date.now(),
  sender,
  status,
  data
})

class MessageService extends MFEService {
  #hub

  constructor () {
    super()

    this.#hub = Object.create(null)

    Object.freeze(this)
  }

  createClient (type, name) {
    if (name) {
      return new MessageServiceClient(this, name)
    }

    return new MessageServiceClient(this, this.hostContext.config.getOrgConfig().Product)
  }

  /**
   * Publishes the topic, passing the data to it's subscribers
   * @function
   * @alias publish
   * @param { String } sender The main app or sub app
   * @param { String } topic The topic to publish
   * @param {} data The data to pass to subscribers
   */
  post (sender, topic, data) {
    if (sender === undefined) {
      console.warn('the message sender be provided')
    }
    verifyTopicArg(topic)
    const message = packMessage(POST, ALL, topic, sender, undefined, data)
    const erros = []
    let handlerName = ''
    // Here we want the try-catch to just detect the exception without termination of the loop.
    try {
      (this.#hub[topic] || []).forEach(handler => {
        handlerName = handler.name || 'anonymous'
        handler(message)
      })
    } catch (e) {
      const errorMessage = packMessage(POST, 'All', topic, sender, FAILED, { error: `function - ${handlerName} from ${sender} has a internal error` })
      erros.push(errorMessage)
    }
    if (erros.length > 0) console.error(erros)
  }

  /**
   * one MFE send the topic to other MFE
   * @function
   * @alias communicateWithOther
   * @param { String } sender the sender mfa name
   * @param { String } topic The topic to publish
   * @param {} data The data to pass to subscribers
   * @param { String } policy Handler process policy, 'First' or 'All'
   * @param { Number } timeout
   * @return { Promise } promise
   */
  async send (sender = undefined, topic, data, policy = FIRST, timeout = 5000) {
    if (sender === undefined) {
      console.warn('the message sender be provided')
    }
    verifyTopicArg(topic)
    let excuteHandlers
    const handlers = this.#hub[topic] || []
    const message = packMessage(POST, policy, topic, sender, undefined, data)
    if (handlers.length === 0) return Promise.reject(new Error(`topic - ${topic} is not existing`))
    if (policy === FIRST) {
      excuteHandlers = [handlers[0](message)]
    } else {
      excuteHandlers = handlers.forEach(handler => handler(message))
    }
    const timeoutError = Symbol('timeout error') // Pass a Symbol as the timeout error argument then check if the rejection is that Symbol
    const run = (prom, time, exception) => {
      let timer
      return Promise.race([
        prom,
        // eslint-disable-next-line promise/param-names
        new Promise((_res, rej) => {
          timer = setTimeout(rej, time, exception)
        })
      ]).finally(() => clearTimeout(timer))
    }
    try {
      // handle result
      const result = await run(Promise.all(excuteHandlers), timeout, timeoutError)
      return packMessage(SEND, policy, topic, sender, SUCCESS, result)
    } catch (e) {
      if (e === timeoutError) {
        // handle timeout
        const errorMessage = packMessage(SEND, policy, topic, sender, FAILED, { error: 'timeout error' })
        return Promise.reject(errorMessage)
      } else {
        // other error
        const errorMessage = packMessage(SEND, policy, topic, sender, FAILED, { error: 'promise rejection' })
        return Promise.reject(errorMessage)
      }
    }
  }

  /**
   * check a topic if exist
   * @function
   * @public
   * @param { String } topic
   */
  hasTopic (topic) {
    if (!this.#hub[topic]) return false
    return true
  }

  /**
   * Subscribes the passed function to the passed message. Every returned token is unique and should be stored if you need to unsubscribe
   * @function
   * @public
   * @param { String } topic The topic to subscribe to
   * @param { Function } handler The function to call when a new message is published
   * @return { String }
   */
  sub (topic, handler) {
    verifyTopicArg(topic)
    if (typeof handler !== 'function') {
      throw new Error('the handler should be a function')
    }
    if (!this.#hub[topic]) this.#hub[topic] = []
    this.#hub[topic].push(handler)
  }

  /**
   * Removes subscriptions
   * @function
   * @public
   * @param { String } topic topic to unsubscribe from
   * @param { Function } handler The function to unsubscribe from topic
   */
  unsub (topic, handler) {
    verifyTopicArg(topic)
    if (typeof handler !== 'function') {
      throw new Error('the handler should be a function')
    }
    const i = (this.#hub[topic] || []).findIndex(h => h === handler)
    if (i > -1) this.#hub[topic].splice(i, 1)
    if (this.#hub[topic].length === 0) delete this.#hub[topic]
  }
}

export default new MessageService()
