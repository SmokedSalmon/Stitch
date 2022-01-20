const commonMockedService = {
  stop: () => {},
  createClient: () => {}
}

export const a1 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['b1', 'a2'],
  start: jest.fn()
}

export const a2 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['b2', 'c1', 'd1'],
  start: jest.fn(() => new Promise(res => { setTimeout(() => res(), 3000) }))
}

export const b1 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['c1', 'c2', 'd1'],
  start: jest.fn()
}

export const b2 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['c1', 'circular_b4'],
  start: jest.fn()
}

export const b3 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['d1'],
  start: jest.fn()
}

export const circular_b4 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['a2', 'd2'],
  start: jest.fn()
}

export const c1 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  start: jest.fn(() => new Promise(res => { setTimeout(() => res(), 3000) }))
}

export const c2 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  require: () => ['d2'],
  start: jest.fn(() => { console.log('c2 started'); console.log(new Date())})
}

export const d1 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  start: jest.fn(() => new Promise(res => { setTimeout(() => res(), 2000) }))
}

export const d2 = {
  ...commonMockedService,
  getStatus: () => 'stopped',
  start: jest.fn(() => new Promise(res => { setTimeout(() => {console.log('d2 started');res()}, 5000) }))
}

// Dummy system service configs
export const systemServiceConfigs = [
  { name: 'a1', disabled: false, protected: true },
  { name: 'a2', disabled: false, protected: true },
  { name: 'b1', disabled: false, protected: true },
  { name: 'b2', disabled: false, protected: true },
  { name: 'b3', disabled: false, protected: true },
  { name: 'circular_b4', disabled: false, protected: true },
  { name: 'c1', disabled: false, protected: true },
  { name: 'c2', disabled: false, protected: true },
  { name: 'd1', disabled: false, protected: true },
  { name: 'd2', disabled: false, protected: true }
]

// map between system service config and actual module
export const systemServices = {
  a1, a2, b1, b2, b3, circular_b4, c1, c2, d1, d2
}
