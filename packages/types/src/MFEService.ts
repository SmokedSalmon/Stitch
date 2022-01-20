import { IHostContext } from './HostContext'

export type MFEServiceStatus = 'starting' | 'started' | 'stopped'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MFEClientService {}

export interface IMFEService {
  require: () => string[]

  start: (hostContext: IHostContext) => Promise<any>

  stop: () => void

  getStatus: () => MFEServiceStatus

  createClient: (type: 'host' | 'app' | 'service', name?: string) => MFEClientService | null
}

export default abstract class MFEService implements IMFEService {
  #status: MFEServiceStatus = 'stopped'
  #hostContext: IHostContext

  protected constructor () {
    if (new.target === MFEService) {
      throw new TypeError('Cannot construct abstract class MFEService instances directly')
    }
  }

  protected get hostContext (): IHostContext {
    return this.#hostContext
  }

  protected set hostContext (value: IHostContext) {
    this.#hostContext = value
  }

  require (): string[] {
    return []
  }

  async start (hostContext: IHostContext): Promise<any> {
    this.#status = 'starting'
    this.#hostContext = hostContext

    return await Promise.resolve()
      .then(() => {
        this.#status = 'started'
      })
  }

  stop (): void {
    this.#status = 'stopped'
  }

  getStatus (): MFEServiceStatus {
    return this.#status
  }

  protected setStatus (value: MFEServiceStatus): void {
    this.#status = value
  }

  createClient (type: 'host' | 'app' | 'service' = 'host', name?: string): MFEClientService | null {
    return null
  }
}
