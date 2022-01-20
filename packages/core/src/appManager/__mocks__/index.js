const state = {};
const mockAppManager = {
  state,
  getApp: (appName) => new Promise(),
  getHostContext: (name) => name,
  setState: (appname, value) => {state[appname] = value},
  getState: (appname) => state[appname]
}

export default mockAppManager