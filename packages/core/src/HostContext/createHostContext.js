import serviceManager from '../serviceManager' // TODO resolve circular dependency
import HostContext from './HostContext'
import { ROUTER_SERVICE } from '../constants'

const createHostContext = (type, targetName, requiredServicesName) => {
  const requiredServices = []
  if (requiredServicesName instanceof Array) {
    requiredServicesName.forEach((name) => {
      const availableService = serviceManager.getServiceSync(name)
      if (availableService) {
        requiredServices.push({
          name,
          service: (availableService.createClient && availableService.createClient(type, targetName)) || availableService
        })
      }
    })
  }
  return new HostContext(serviceManager.getServiceSync(ROUTER_SERVICE).getRouterMode(), type, targetName, requiredServices)
}

export default createHostContext
