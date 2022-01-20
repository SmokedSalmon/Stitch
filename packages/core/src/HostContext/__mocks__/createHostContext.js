export default function createHostContext(name, config){
  return {
    targetName: name,
    config: config,
    services: [],
    hostPath: ''
  }
}