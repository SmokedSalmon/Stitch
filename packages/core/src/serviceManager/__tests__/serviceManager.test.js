// Jest 26 & 27 has issue for fake timer + promise, we cannot use Jest's own fake timer to test asynchronous features
// issue: https://stackoverflow.com/questions/51126786/jest-fake-timers-with-promises
// Facebook team not yet fix it, pending issue: https://github.com/facebook/jest/pull/5171
// Jest 27 has provided @sinonjs/fake-timers as a temporary solution, import here.
import FakeTimers from "@sinonjs/fake-timers";
import serviceManager from '../ServiceManager'

// mock dependencies of other stitch modules
jest.mock('@stitch/types/MFEService')
jest.mock('../../configManager/ConfigManager')
jest.mock('../../HostContext/createHostContext')
// mocked dummy system services
jest.mock('../../services/constants') // dummy service configs and implementation to be use in ServiceManager.js

describe('Service Manager Start Sequence order tests', () => {
  let fakeTimer
  beforeAll(() => {
    // faked timer to control time flow for asynchronous feature testing
    fakeTimer = FakeTimers.install()
  })

  afterAll(() => {
    fakeTimer.uninstall() // clear fake timer
    jest.clearAllMocks() // clear mock function statistics so that subsequent test suits won't be impact
  })

  test('Async services are not started at the beginning of startServices(), and only starts after condition met', async () => {
    serviceManager.startServices(['c2'])
    // time mark 0.5s since sequence start, the synchronous part still takes some milliseconds to run
    await fakeTimer.tickAsync(500)
    const d2 = serviceManager.getServiceSync('d2')
    const c2 = serviceManager.getServiceSync('c2')
    expect(d2.start).toBeCalled()
    expect(c2.start).not.toBeCalled()
    // time mark 6.50s since sequence start
    await fakeTimer.tickAsync(6000)
    expect(c2.start).toBeCalled()
  })
})

describe('Service Manager full Start Sequence tests for overall results', () => {
  let a1, a2, b1, b2, b3, circular_b4, c1, c2, d1, d2
  beforeAll(
    () => serviceManager.startServices(['a1', 'a2']).then(() => {
      a1 = serviceManager.getServiceSync('a1')
      a2 = serviceManager.getServiceSync('a2')
      b1 = serviceManager.getServiceSync('b1')
      b2 = serviceManager.getServiceSync('b2')
      b3 = serviceManager.getServiceSync('b3')
      circular_b4 = serviceManager.getServiceSync('circular_b4')
      c1 = serviceManager.getServiceSync('c1')
      c2 = serviceManager.getServiceSync('c2')
      d1 = serviceManager.getServiceSync('d1')
      d2 = serviceManager.getServiceSync('d2')
    })
  )

  afterAll(() => jest.clearAllMocks())

  test('All REQUIRED services are started', async () => {
    // wait to make sure all services started
    expect(d1.start).toHaveBeenCalled()
    expect(d2.start).toHaveBeenCalled()
    expect(c1.start).toHaveBeenCalled()
    expect(c2.start).toHaveBeenCalled()
    expect(circular_b4.start).toHaveBeenCalled()
    expect(b1.start).toHaveBeenCalled()
    expect(b2.start).toHaveBeenCalled()
    expect(a1.start).toHaveBeenCalled()
    expect(a2.start).toHaveBeenCalled()
  })

  test('All required services are started only ONCE', async () => {
    // wait to make sure all services started
    expect(d1.start).toHaveBeenCalledTimes(1)
    expect(d2.start).toHaveBeenCalledTimes(1)
    expect(c1.start).toHaveBeenCalledTimes(1)
    expect(c2.start).toHaveBeenCalledTimes(1)
    expect(circular_b4.start).toHaveBeenCalledTimes(1)
    expect(b1.start).toHaveBeenCalledTimes(1)
    expect(b2.start).toHaveBeenCalledTimes(1)
    expect(a1.start).toHaveBeenCalledTimes(1)
    expect(a2.start).toHaveBeenCalledTimes(1)
  })

  test('Services that are not required should not be involved', () => {
    expect(serviceManager.getServiceSync('b3').start).not.toHaveBeenCalled()
  })

  test('Services start in an order based on their dependency relationship', () => {
    expect(serviceManager.getServiceSync('a1').start)
      .toHaveBeenCalledAfter(serviceManager.getServiceSync('d1').start)
  })
})

describe('Service Manager full Start Sequence tests for timing of each service (upon invoke & complete)', () => {
  let fakeTimer
  beforeAll(() => {
    // faked timer to control time flow for asynchronous feature testing
    fakeTimer = FakeTimers.install()
    serviceManager.startServices(['a1', 'a2'])
  })

  test('Service start right after their sub-services resolved, independent to all other services including collateral relations', async () => {
    // time mark 4.5s since sequence start
    await fakeTimer.tickAsync(4500)
    const d2 = serviceManager.getServiceSync('d2')
    const c2 = serviceManager.getServiceSync('c2')
    expect(d2.start).toBeCalled()
    expect(c2.start).not.toBeCalled()
    // time mark 5.1s since sequence start
    await fakeTimer.tickAsync(600)
    expect(c2.start).toBeCalled()
  })

  afterAll(() => {
    fakeTimer.uninstall()
    jest.clearAllMocks()
  })
})
