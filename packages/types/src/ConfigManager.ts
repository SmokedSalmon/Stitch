export interface Org {
  GBGF?: string

  EIM?: string

  Product: string
}

export type Env = 'Dev' | 'Prod'

export interface StyleConfig {
  uniqueID: string

  styleName: string

  libName: string

  styleUrl: string

  autoLoad: boolean
}

export interface AppConfig {
  name: string

  libName: string

  libUrl: string

  mode: 'Web' | 'IFrame'

  routerName?: string

  styles: StyleConfig[]

  options?: object
}

export type ServiceType = 'SYSTEM' | 'LIB' | 'CUSTOMIZED'

export interface ServiceConfig {
  serviceName: string

  type: ServiceType

  libName?: string

  libUrl?: string

  autoLoad?: boolean

  disabled: boolean

  protected: boolean

  options?: object
}
