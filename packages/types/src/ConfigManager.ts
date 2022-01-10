export interface Org {
  GBGF?: string

  EIM?: string

  Product: string
}

export type Env = 'Dev' | 'Prod'

export interface StyleConfig {
  uniqueID: string

  name: string

  styleUrl: string

  autoLoad: boolean
}

export interface AppConfig {
  name: string

  mode: 'Web' | 'IFrame'

  routerName?: string[]

  styles: StyleConfig[]

  options?: object
}

export type ServiceType = 'SYSTEM' | 'LIB' | 'CUSTOMIZED'

export interface ServiceConfig {
  name: string

  autoLoad?: boolean

  disabled: boolean

  protected: boolean

  options?: object
}
