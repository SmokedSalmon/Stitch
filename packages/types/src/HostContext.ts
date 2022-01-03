import { Org, Env, AppConfig, ServiceConfig, StyleConfig } from './ConfigManager'
import MFEService, { MFEClientService } from './MFEService'

export interface IConfig {
  getRawConfig: () => object

  getOrgConfig: () => Org

  getEnv: () => Env

  getRouterPath: () => string

  getGlobalOptions: () => object

  getAppConfig: (appName: string) => AppConfig

  getServiceConfig: (serviceName: string) => ServiceConfig

  getStyleConfig: (libName: string, styleName?: string) => StyleConfig[]
}

export interface IHostContext {
  readonly targetName: string

  readonly hostPath: string

  readonly config: IConfig

  readonly services: IRequiredServices
}

export interface IRequiredServices {
  getServices: (name: string) => MFEService | MFEClientService | null

  readonly [index: string]: MFEService | MFEClientService
}
