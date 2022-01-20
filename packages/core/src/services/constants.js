import { MESSAGE_SERVICE, ROUTER_SERVICE, STYLE_SERVICE } from '../constants'
import messageService from './messageService'
import styleService from './styleService'

// config for all system services
export const systemServiceConfigs = [
  {
    name: MESSAGE_SERVICE,
    disabled: false,
    protected: true
  },
  {
    name: STYLE_SERVICE,
    disabled: false,
    protected: true
  },
  {
    name: ROUTER_SERVICE,
    disabled: false,
    protected: true
  }
]

// map between system service config and actual module
export const systemServices = {
  [MESSAGE_SERVICE]: messageService,
  [STYLE_SERVICE]: styleService
}
