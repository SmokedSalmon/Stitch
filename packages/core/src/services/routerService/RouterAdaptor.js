/**
 * This is an adapter for providing standard interface to host to inject their router
 * So that its remote app can consume it as part of SPA module
 *
 * Is it an mandatory service?  Answer: It depends on our use case, if we are always running at a giant SPA, Yes. else, No.
 * We are basing on history (v5) API to design a rough version for now, we might add more method in the future, it depends where we are.
 * Reference: https://github.com/remix-run/history/blob/main/docs/api-reference.md
 */
import NavPrompt from './NavPrompt'

/**
  * This is a parent class for host
  * for different host env, pls extend it or override below function if you needed
  * Why I prefer calling it "Adaptor" cause this is only a interface, the really working one is behind the host such React-Dom-Router or other.
  */
class RouterAdaptor {
  #navPrompt

  // let's assume we will inject host router properties in this constructor
  constructor (hostHistory) {
    this.history = hostHistory
    // eslint-disable-next-line new-cap
    this.#navPrompt = new NavPrompt(this)
  }

  get action () {
    return this.history.action
  }

  get location () {
    return this.history.location
  }

  push (to, state) {
    this.history.push(to, state)
  }

  replace (to, state) {
    this.history.replace(to, state)
  }

  go (n) {
    this.history.go(n)
  }

  back () {
    this.history.back()
  }

  forward () {
    this.history.forward()
  }

  // [TODO] internalize this method for safety reason
  block (prompt) {
    return this.history.block(prompt)
  }

  listen (listener) {
    return this.history.listen(listener)
  }

  // Attach nav Prompt as a tool/method of Stitch's router
  get navPrompt () {
    return this.#navPrompt
  }
}

export class RouterAdaptorHistoryV4 extends RouterAdaptor {
  back () {
    this.history.goBack()
  }

  forward () {
    this.history.goForward()
  }
}

export default RouterAdaptor
