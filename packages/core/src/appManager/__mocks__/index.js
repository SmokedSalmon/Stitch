const mockAppManager = {
  getApp: (appName) => new Promise({
    config: {},
    instance: {
      init: (hostContext) => hostContext,
      mount: (dom) => {},
      unmount: (dom) => {},
      require: () => []
    },
    state: {},
    hostContext: {}
  })
}

export default mockAppManager