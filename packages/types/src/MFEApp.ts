import { IHostContext } from './HostContext'

export interface IMFEApp {
  readonly hostContext: IHostContext

  require: () => string[]

  init: (hostContext: IHostContext) => void

  mount: (dom: HTMLElement) => void

  unmount: (dom: HTMLElement) => void
}

export default abstract class MFEApp implements IMFEApp {
  #hostContext: IHostContext

  protected constructor () {
    if (new.target === MFEApp) {
      throw new TypeError('Cannot construct abstract class MFEApp instances directly')
    }
  }

  get hostContext (): IHostContext {
    return this.#hostContext
  }

  protected set hostContext (value: IHostContext) {
    this.#hostContext = value
  }

  require (): string[] {
    return []
  }

  init (hostContext: IHostContext): void {
    this.#hostContext = hostContext
  }

  // @ts-expect-error
  abstract mount (dom: HTMLElement): void {
    throw new TypeError('MFEApp abstract member mount() is not implemented')
  }

  // @ts-expect-error
  abstract unmount (dom: HTMLElement): void {
    throw new TypeError('MFEApp abstract member unmount() is not implemented')
  }
}
