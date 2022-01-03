import { IMFEApp } from './MFEApp'
import { IMFEService } from './MFEService'

export interface IMFELib {
  getApp?: (name: string) => IMFEApp

  getApps?: () => IMFEApp[]

  getService?: (name: string) => IMFEService

  getServices?: () => IMFEService[]
}
