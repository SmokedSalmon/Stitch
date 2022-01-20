import { fromJS } from 'immutable'

// mock validate.js as default succeed
jest.mock('../validate', () => {
  return (schema) => jest.fn((config) => true)
})
jest.mock('../../services/constants')

// mocked config for coverage, refers: /packages/core/src/configManager/schemas/*
// updateConfig should support immutable config parameter
const mockedConfig = fromJS({
  org: {
    GBGF: 'mockedGBGF',
    EIM: 'mockedEIM',
    Product: 'mockedChannel'
  },
  env: 'Dev',
  routerPath: 'mockedRouterPath',
  hosts: [
    {
      name: 'mockedHost',
      protocol: 'https',
      server: 'localhost',
      port: 3002,
      publicPath: '/mocked-path'
    },
    { // cover branches
      name: 'mockedHostWithoutPort',
      protocol: 'https',
      server: 'localhost',
      publicPath: '/mocked-path'
    }
  ],
  libs: [{
    name: 'mockedLib',
    hostName: 'mockedHost',
    resource: '/mocked-resource/remoteEntry.js',
    styles: [{
      name: 'mockedStyle',
      hostName: 'mockedHost',
      resource: '/mocked-resource/style.css',
      autoLoad: true
    }],
    apps: [
      {
        name: 'mockedApp',
        mode: 'Web',
        routerName: ['mockedRouterName'],
        options: {},
        styles: ['mockedStyle']
      },
      { // cover branches
        name: 'mockedAppWithEmptyRouterName',
        routerName: []
      }
    ],
    services: [{
      name: 'mockedLibService',
      autoLoad: true,
      disabled: false,
      protected: true,
      options: {}
    }]
  }],
  services: [{
    name: 'mockedService',
    disabled: false,
    protected: true,
    options: {}
  }],
  globalOptions: {
    mockedOptionKey: 'mockedOptionValue'
  }
}).toJS()

let configManager = require('../index').default
let logFatal
let logError

const updateConfigErrorCode = 'CM-P-5002'

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.resetModules() // reset modules for mock validate.js
  })

  test('frozen constructor', () => {
    try {
      configManager.testProperty = 'test';
    } catch (error) {
      expect(error.toString()).toBe('TypeError: Cannot add property testProperty, object is not extensible')
    }
  })

  test('validateConfig', () => {
    const { default: ConfigManager, validate } = require('../ConfigManager')
    const valid = ConfigManager.validateConfig(mockedConfig)
    const mockedValidate = validate

    expect(valid).toBe(true)
    expect(mockedValidate.mock.calls.length).toBe(1)
    expect(mockedValidate.mock.calls[0][0]).toEqual(mockedConfig)
  })

  test('validateConfig validate return false', () => {
    jest.doMock('../validate', () => {
      return (schema) => jest.fn((config) => false)
    })

    const { default: ConfigManager } = require('../ConfigManager')
    const valid = ConfigManager.validateConfig(mockedConfig)

    expect(valid).toBe(false)
  })

  test('validateConfig validate throw error', () => {
    const mockedError = new TypeError('mocked type error')

    jest.doMock('../validate', () => {
      return (schema) => jest.fn((config) => {
        throw mockedError
      })
    })
    jest.doMock('../../utils/log/Logger')

    const { default: ConfigManager } = require('../ConfigManager')
    const { default: Logger } = require('../../utils/log/Logger')

    logFatal = Logger.mock.instances[0].fatal

    try {
      ConfigManager.validateConfig(mockedConfig)
    } catch (error) {
      expect(error).toBe(mockedError)
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(mockedError)
      expect(logFatal.mock.calls[0][1]).toBe('CM-P-5001')
    }
  })

  test('updateConfig', () => {
    // can support empty object
    configManager.updateConfig({})

    configManager.updateConfig(mockedConfig)
  })

  test('getRawConfig', () => {
    expect(configManager.getRawConfig()).toMatchSnapshot()
  })

  test('getOrgConfig', () => {
    expect(configManager.getOrgConfig()).toEqual(mockedConfig.org)
  })

  test('getEnv', () => {
    expect(configManager.getEnv()).toBe(mockedConfig.env)
  })

  test('getRouterPath', () => {
    expect(configManager.getRouterPath()).toBe(mockedConfig.routerPath)
  })

  test('getGlobalOptions', () => {
    expect(configManager.getGlobalOptions()).toEqual(mockedConfig.globalOptions)
  })

  test('setGlobalOptions', () => {
    const newGlobalOptions = {
      mockedOptionKey: 'mockedOptionValueUpdated',
      mockedOptionKey2: 'mockedOptionValue2',
    }

    configManager.setGlobalOptions(newGlobalOptions)

    expect(configManager.getGlobalOptions()).toEqual(newGlobalOptions)
  })

  test('getAppConfig', () => {
    expect(configManager.getAppConfig('mockedApp')).toMatchSnapshot()
    expect(configManager.getAppConfig()).toMatchSnapshot()
  })

  test('setAppOptions', () => {
    const newAppOptions = {
      mockedAppOptionKey: 'mockedAppOptionValue'
    }

    configManager.setAppOptions('mockedApp', newAppOptions)

    expect(configManager.getAppConfig('mockedApp').options).toEqual(newAppOptions)
  })

  test('getAppName', () => {
    expect(configManager.getAppName('mockedRouterName')).toBe('mockedApp')
    expect(configManager.getAppName('mockedAppWithEmptyRouterName')).toBe('mockedAppWithEmptyRouterName')
    // cover branches
    expect(configManager.getAppName('nonexistentRouterName')).toBe('')
    expect(configManager.getAppName('')).toBe('')
  })

  test('getServiceConfig', () => {
    expect(configManager.getServiceConfig('mockedService')).toMatchSnapshot()
    expect(configManager.getServiceConfig('mockedLibService')).toMatchSnapshot()
    expect(configManager.getServiceConfig()).toMatchSnapshot()
  })

  test('setServiceOptions', () => {
    const newServiceOptions = {
      mockedServiceOptionKey: 'mockedServiceOptionValue'
    }

    configManager.setServiceOptions('mockedService', newServiceOptions)
    configManager.setServiceOptions('mockedLibService', newServiceOptions)

    expect(configManager.getServiceConfig('mockedService').options).toEqual(newServiceOptions)
    expect(configManager.getServiceConfig('mockedLibService').options).toEqual(newServiceOptions)
  })

  test('getStyleConfig', () => {
    expect(configManager.getStyleConfig('mockedLib')).toMatchSnapshot()
    expect(configManager.getStyleConfig('mockedLib', 'mockedStyle')).toMatchSnapshot()
    expect(configManager.getStyleConfig('stitch_mfe_style_1')).toMatchSnapshot()
  })
})

describe('ConfigManager.updateConfig #convertConfig failed', () => {
  beforeEach(() => {
    jest.resetModules() // reset modules for mock validate.js

    jest.doMock('../validate', () => {
      return (schema) => jest.fn((config) => true)
    })
    jest.doMock('../../utils/log/Logger')

    // require newly ConfigManager singleton instance for each test
    const { default: mockedConfigManager } = require('../index')
    configManager = mockedConfigManager

    // require mocked Logger for each test
    const { default: Logger } = require('../../utils/log/Logger')
    logFatal = Logger.mock.instances[0].fatal
  })

  test('duplicate "name" of "hosts" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        hosts: [
          ...mockedConfig.hosts,
          { name: 'mockedHost' }
        ]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('duplicate "name" of "libs" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [
          ...mockedConfig.libs,
          { name: 'mockedLib' }
        ]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('missing "hosts" item definition for "libs" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        hosts: []
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('missing the matched "hosts" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [{
          ...mockedConfig.libs[0],
          styles: [{
            ...mockedConfig.libs[0].styles[0],
            hostName: 'wrongHostName'
          }]
        }]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('duplicate "name" of "styles" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [{
          ...mockedConfig.libs[0],
          styles: [
            ...mockedConfig.libs[0].styles,
            { name: 'mockedStyle' }
          ]
        }]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('missing "styles" item definition for "apps" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [{
          ...mockedConfig.libs[0],
          apps: [{
            ...mockedConfig.libs[0].apps[0],
            styles: ['wrongStyleName']
          }]
        }]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('duplicate "name" of "apps" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [{
          ...mockedConfig.libs[0],
          apps: [
            ...mockedConfig.libs[0].apps,
            { name: 'mockedApp' }
          ]
        }]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('duplicate "routerName" of "apps" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [{
          ...mockedConfig.libs[0],
          apps: [
            ...mockedConfig.libs[0].apps,
            {
              name: 'mockedApp2',
              routerName: ['mockedRouterName']
            }
          ]
        }]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('duplicate "name" of "services" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        services: [
          ...mockedConfig.services,
          { name: 'mockedService' }
        ]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })

  test('duplicate "name" of "services" item of "libs" item', () => {
    try {
      configManager.updateConfig({
        ...mockedConfig,
        libs: [{
          ...mockedConfig.libs[0],
          services: [
            ...mockedConfig.libs[0].services,
            { name: 'mockedLibService' }
          ]
        }]
      })
    } catch (error) {
      expect(logFatal.mock.calls.length).toBe(1)
      expect(logFatal.mock.calls[0][0]).toBe(error)
      expect(logFatal.mock.calls[0][0]).toMatchSnapshot()
      expect(logFatal.mock.calls[0][1]).toBe(updateConfigErrorCode)
    }
  })
})

describe('ConfigManager when globalState stitchStart = true', () => {
  beforeEach(() => {
    jest.resetModules() // reset modules for mock globalState.js

    jest.doMock('../../utils/globalState.js', () => ({
      stitchStart: true
    }))
    jest.doMock('../../utils/log/Logger')

    // require newly ConfigManager singleton instance for each test
    const { default: mockedConfigManager } = require('../index')
    configManager = mockedConfigManager

    // require mocked Logger for each test
    const { default: Logger } = require('../../utils/log/Logger')
    logError = Logger.mock.instances[0].error

    configManager.updateConfig(mockedConfig)
  })

  test('setGlobalOptions', () => {
    configManager.setGlobalOptions()

    expect(logError.mock.calls.length).toBe(1)
    expect(logError.mock.calls[0][0]).toMatchSnapshot()
    expect(logError.mock.calls[0][1]).toBe('CM-B-4001')
  })

  test('updateConfig', () => {
    configManager.updateConfig()

    expect(logError.mock.calls.length).toBe(1)
    expect(logError.mock.calls[0][0]).toMatchSnapshot()
    expect(logError.mock.calls[0][1]).toBe('CM-B-4002')
  })

  test('setAppOptions', () => {
    configManager.setAppOptions('mockedApp')

    expect(logError.mock.calls.length).toBe(1)
    expect(logError.mock.calls[0][0]).toMatchSnapshot()
    expect(logError.mock.calls[0][1]).toBe('CM-B-4003')
  })

  test('setServiceOptions', () => {
    configManager.setServiceOptions('mockedService')

    expect(logError.mock.calls.length).toBe(1)
    expect(logError.mock.calls[0][0]).toMatchSnapshot()
    expect(logError.mock.calls[0][1]).toBe('CM-B-4004')
  })
})

describe('ConfigManager cover branches', () => {
  beforeEach(() => {
    jest.resetModules() // reset modules for mock globalState.js

    // require newly ConfigManager singleton instance for each test
    const { default: mockedConfigManager } = require('../index')
    configManager = mockedConfigManager
  })

  test('updateConfig', () => {
    configManager.updateConfig({
      libs: [{
        name: 'mockedLib',
        // cover `libs` item without `apps` property
        styles: [{
          name: 'mockedStyle',
          // cover `resource` full path of `styles` item
          resource: 'http://mocked/style.css'
        }]
      }]
    })
  })
})
