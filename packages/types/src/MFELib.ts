import { IMFEApp } from './MFEApp'
import { IMFEService } from './MFEService'

export interface IMFELib {
  getApp: (name: string) => IMFEApp | null

  getApps: () => Array<{ name: string, instance: IMFEApp }>

  getService: (name: string) => IMFEService | null

  getServices: () => Array<{ name: string, instance: IMFEService }>
}
