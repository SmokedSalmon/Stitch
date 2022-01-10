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
let spyInit;

const domMount = {
  test: "this is a dom",
};
const mockHost = {
  test: "this is hostContext",
};


describe("renderApp", () => {
  beforeEach(() => {
    // Lock Time
    
    stepTrackArray = [];
    instance = {
      init: (hostContext) => stepTrackArray.push(hostContext),
      mount: (dom) => stepTrackArray.push(dom),
      unmount: (dom) => stepTrackArray.push(dom),
      require: () => [],
    };

    spyGetApp = jest.spyOn(appManager, "getApp");

    spyMount = jest.spyOn(instance, "mount");
    spyInit = jest.spyOn(instance, "init");
    spyUnmount = jest.spyOn(instance, "unmount");

    spyGetApp.mockReturnValue(
      new Promise((re)=> re({
        config: {},
        instance,
        state: APP_STATUS.Inactive,
        hostContext: mockHost,
      }))
    );
  })
  
  afterEach(() => {
    stepTrackArray = [];
    spyGetApp.mockRestore();
    spyMount.mockRestore();
    spyInit.mockRestore();
  })

  it("renderApp for app with Inactive status in base flow", () => {
    
    return render.renderApp(domMount, "test").then((item) => {
      expect(stepTrackArray[0]).toEqual(mockHost);
      expect(stepTrackArray[1]).toEqual(domMount);
      expect(spyMount).toHaveBeenCalledTimes(1);
      expect(spyInit).toHaveBeenCalledTimes(1);
     
    });
  });

  // expect init only will be trigger when app state is !== Initialized
  it("renderApp for app with Initialized status in base flow", () => {
    spyGetApp.mockReturnValue(
      new Promise((re)=> re({
        config: {},
        instance,
        state: APP_STATUS.Initialized,
        hostContext: mockHost,
      }))
    );

    return render.renderApp(domMount, "test").then((item) => {
      expect(stepTrackArray[0]).toEqual(domMount);
      expect(spyMount).toHaveBeenCalledTimes(1);
      expect(spyInit).toHaveBeenCalledTimes(0);

    });
  });
  

  it("cleanApp base flow ", () => {
    return render.cleanApp(domMount, "test").then((item) => {
      expect(stepTrackArray[0]).toEqual(domMount);
      expect(spyUnmount).toHaveBeenCalledTimes(1);
    });
  });

  // exception flow
  it("renderApp with exceptional flow ??", () => {
    // TODO
  });
  
});
