import serviceManager from '../serviceManager'// TODO resolve circular dependency
import HostContext from './HostContext'

export const createHostContext = (type, targetName, requiredServicesName) => {
  const requiredServices = [];
  if (requiredServicesName instanceof Array) {
    requiredServicesName.forEach((name) => {
      const availableService = serviceManager.getService(name)
      if (availableService) {
        requiredServices.push({
          name,
          service : availableService.createClient && availableService.createClient(type, targetName) || availableService
        })
      }
    })
  }
  return new HostContext(type, targetName, requiredServices)
}
