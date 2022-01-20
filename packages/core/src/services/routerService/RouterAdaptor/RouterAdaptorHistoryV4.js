import RouterAdaptor from './RouterAdaptor'

export default class RouterAdaptorHistoryV4 extends RouterAdaptor {
  back () {
    this.history.goBack()
  }

  forward () {
    this.history.goForward()
  }
}
