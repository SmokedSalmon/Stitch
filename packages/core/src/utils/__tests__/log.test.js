import log from '../log'
import Logger from '../log/Logger'
import logHandlers from '../log/handlers'


describe("log", () => {
  beforeEach(() => {

  })

  afterEach(() => {
  })


  it("getLogger interface testing", () => {
    const logger = log.getLogger('module-name')
    expect(logger instanceof Logger).toEqual(true)
    expect(typeof logger.debug).toEqual('function')
    expect(typeof logger.info).toEqual('function')
    expect(typeof logger.warn).toEqual('function')
    expect(typeof logger.error).toEqual('function')
    expect(typeof logger.fatal).toEqual('function')


  });

  it("handler testing", () => {
    //
    // jest.mock('../log/Logger');
    // let debugStub = logHandlers.debug.mockImplementationOnce((args) => args[0])
    // const logger = log.getLogger('module-name')
    // logger.debug("xx", 'xxx')
    // expect(debugStub).toEqual('module')
  });

});
