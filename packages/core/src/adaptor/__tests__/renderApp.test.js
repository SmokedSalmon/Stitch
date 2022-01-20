import * as render from "../renderApp";
import appManager from '../../appManager';
import { APP_STATUS } from '../../constants'

// we are going to mock appManager & ServiceManager
jest.mock("../../appManager");
jest.mock("../../serviceManager");

let stepTrackArray;
let instance;
let spyGetApp;
let spyMount;
let spyUnmount;

const domMount = {
  test: "this is a dom",
};

describe("renderApp", () => {
  beforeEach(() => {
    // Lock Time
    
    stepTrackArray = [];
    instance = {
      mount: (dom) => stepTrackArray.push(dom),
      unmount: (dom) => stepTrackArray.push(dom),
      require: () => [],
    };

    spyGetApp = jest.spyOn(appManager, "getApp");

    spyMount = jest.spyOn(instance, "mount");
    spyUnmount = jest.spyOn(instance, "unmount");

    spyGetApp.mockReturnValue(
      new Promise((re)=> re(instance))
    );
  })
  
  afterEach(() => {
    stepTrackArray = [];
    spyGetApp.mockRestore();
    spyMount.mockRestore();
  })

  it("renderApp for app with Inactive status in base flow", async () => {
    
    const item = await render.renderApp(domMount, "test");
    expect(stepTrackArray[0]).toEqual(domMount);
    expect(spyMount).toHaveBeenCalledTimes(1);
  });

  it("cleanApp base flow ", async () => {
    await render.cleanApp(domMount, "test");
    expect(stepTrackArray[0]).toEqual(domMount);
    expect(spyUnmount).toHaveBeenCalledTimes(1);
  });

  // exception flow
  it("renderApp with exceptional flow", async () => {
    // missing wrong 
    instance = {
      require: () => [],
    };
    spyGetApp.mockReturnValue(
      new Promise((re)=> re(instance))
    );
    await render.renderApp(domMount, "test");
    expect(stepTrackArray).toEqual([]);
    // we expect app status will be changed
    const data = appManager.getState('test');
    expect(data).toEqual(APP_STATUS.RunError);
  });

  it("cleanApp with exceptional flow", async () => {
    // missing wrong 
    instance = {
      require: () => [],
    };
    spyGetApp.mockReturnValue(
      new Promise((re)=> re(instance))
    );
    await render.cleanApp(domMount, "test");
    expect(stepTrackArray).toEqual([]);
    // we expect app status will be changed
    const data = appManager.getState('test');
    expect(data).toEqual(APP_STATUS.RunError);
  });
  
});
