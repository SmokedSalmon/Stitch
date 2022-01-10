
import serviceManger from '../ServiceManager'
import { MFEService } from '@stitch/types'

jest.mock('@stitch/types/MFEService')
jest.mock('../../configManager/ConfigManager')

export const a1 = new (class extends MFEService {
  require() { return ['b1', 'a2'] }
  start() { super.start(); console.log('===> a1 starts'); }
})

export const a2 = new (class extends MFEService {
  require() { return ['b2', 'c1', 'd1'] }
  start() { super.start(); return new Promise((res) => setTimeout(() => {
    console.log('===> a2 starts'); res();
  }, 3000))}
})

export const b1 = new (class extends MFEService {
  require() { return ['c1', 'c2', 'd1'] }
  start() { super.start(); console.log('===> b1 starts'); }
})

export const b2 = new (class extends MFEService {
  require() { return ['c1', 'circular_b4'] }
  start() { super.start(); console.log('===> b2 starts'); }
})

export const b3 = new (class extends MFEService {
  require() { return ['d1'] }
  start() { super.start(); console.log('===> b3 starts'); }
})

export const circular_b4 = new (class extends MFEService {
  require() { return ['a2', 'd2'] }
  start() { super.start(); console.log('===> circular_b4 starts'); }
})

export const c1 = new (class extends MFEService {
  start() { super.start(); return new Promise((res) => setTimeout(() => {
    console.log('===> c1 starts'); res();
  }, 3000))}
})

export const c2 = new (class extends MFEService {
  require() { return ['d2'] }
  start() { super.start(); console.log('===> c2 starts'); }
})

export const d1 = new (class extends MFEService {
  start() { super.start(); return new Promise((res) => setTimeout(() => {
    console.log('===> d1 starts'); res();
  }, 2000))}
})

export const d2 = new (class extends MFEService {
  start() { super.start(); return new Promise((res) => setTimeout(() => {
    console.log('===> d2 starts'); res();
  }, 5000))}
})

describe('Service Manager Start Sequence', () => {
  beforeAll(() => {
    return serviceManger.startServices(['a1', 'a2'])
  })

  test('Service can require', () => {
    a1.require()
    expect(a1.require.mock.results[0].value).toEqual(['b1', 'a2'])
    expect(a1.require.mock.calls.length).toBe(1)
  })


  test('Service starts in Sequence', async () => {

    expect(a1.start.mock.calls.length).toBe(1)
  })
})
