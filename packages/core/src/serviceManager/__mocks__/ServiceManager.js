const mock = {
  startServices: (appname) => Promise.resolve({
    name: appname
  }),
  getService: (appname) => ({})
}

export default mock
