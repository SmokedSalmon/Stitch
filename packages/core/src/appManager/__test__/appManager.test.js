import appManager from "../AppManager";
// import * as loadModule from "../../utils/loadModule";
import configManager from "../../configManager/ConfigManager";
import serviceManager from "../../serviceManager/ServiceManager";
import { APP_STATUS } from '../../constants'

// mock serviceManager
jest.mock("../../serviceManager/ServiceManager");
// mock config manager
jest.mock("../../configManager/ConfigManager");

// mock loadScriptAsync
jest.mock("../../utils/loadModule");
jest.mock("../../HostContext/createHostContext");

const testSuccessfulAppName = "testSuccessfulAppName";

let stepTrackArray;
let instance;
let spyConfigManager;
let spyServiceManager;
let spyGetService;
let windowSpy;
const __webpack_init_sharing__ = jest.fn().mockImplementation(()=> Promise.resolve());
global.__webpack_init_sharing__ = __webpack_init_sharing__;
global.__webpack_share_scopes__ = {
  default: {}
};
const mockApp = {
  mount: (dom) => stepTrackArray.push(dom),
  unmount: (dom) => stepTrackArray.push(dom),
  require: () => [],
  init: () => {},
}

describe("appManager", () => {
  beforeEach(() => {
    // Lock Time
    stepTrackArray = [];
    windowSpy = jest.spyOn(global, "window", "get");
    spyConfigManager = jest.spyOn(configManager, "getAppConfig");

    spyServiceManager = jest.spyOn(serviceManager, "startServices");
    spyGetService  = jest.spyOn(serviceManager, "getService");
    // loadModuleSpy = jest.spyOn(loadModule, 'loadScriptAsync');

    windowSpy.mockImplementation(() => ({
      [testSuccessfulAppName]: {
        init: () => Promise.resolve(),
        get: (name) =>
          Promise.resolve(() => ({
            default: {
              getApp: (name) => mockApp
            },
          })),
      },
    }));
    spyServiceManager.mockImplementation((appname) => Promise.resolve({
      name: appname
    }));
    spyGetService.mockImplementation((appname) => ({
      name: appname
    }));
    spyConfigManager.mockImplementation((name) => ({
      name: testSuccessfulAppName,
      libName: testSuccessfulAppName,
      libUrl: testSuccessfulAppName,
    }));
    // webpackHookSpy.mockImplementation((str) => ());
    // mock app for happy flow

  });

  afterEach(() => {
    stepTrackArray = [];
    spyConfigManager.mockRestore();
    spyServiceManager.mockRestore();
    spyGetService.mockRestore();
    windowSpy.mockRestore();
  });

  it("getApp setState, getState with its success flow", async () => {
    await appManager.getApp(testSuccessfulAppName);
    const state = appManager.getState(testSuccessfulAppName);
    expect(state).toEqual(APP_STATUS.Initialized);

    appManager.setState(testSuccessfulAppName, APP_STATUS.Inactive);
    const stateInactive = appManager.getState(testSuccessfulAppName);
    expect(stateInactive).toEqual(APP_STATUS.Inactive);
  });


  it("call two times for the same APP", async () => {
    const app1 = await appManager.getApp(testSuccessfulAppName);
    const app2 = await appManager.getApp(testSuccessfulAppName);
    // any can help me to check below expect was wrong???
    // expect(spyConfigManager).toHaveBeenCalledTimes(1);
    expect(app1).toEqual(app2);
  });

  it("getConfig", () => {

    appManager.getConfig(testSuccessfulAppName);
    // configManager.getAppConfig should be call
    expect(spyConfigManager).toHaveBeenCalledTimes(1);

  });

  it("forceInit", async () => {

    await appManager.getApp(testSuccessfulAppName);
    appManager.setState(testSuccessfulAppName, APP_STATUS.Inactive);
    appManager.forceInit(testSuccessfulAppName);
    const state = appManager.getState(testSuccessfulAppName);
    expect(state).toEqual(APP_STATUS.Loaded);

    // if we can't get config , we will throw
    try {
      spyConfigManager.mockReturnValue({})
      appManager.forceInit('notExistingApp');
    } catch (error) {
      expect(error instanceof Error).toEqual(true);
    }
  });
});
