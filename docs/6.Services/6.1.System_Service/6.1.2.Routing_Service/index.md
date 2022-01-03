# Routing Service

If we are developing a SPA with multiple pages, A router is needed for routing to different pages, passing data from one component to another component.

In this case, the Router should be a single instance server to those pages and make it consistent with browser behavior.

In Stitch, Router Service was born for server these purposes:

1. Eliminate different history instances from Host to MFA
2. Establish a consolidated interface to different MFA
3. Give us a more useful advanced API to reduce MFA's development effort.

For more you need to know is, Router Service is an optional service in Stitch.

Why? Because Stitch can be just a tool, in that case, the router is no longer useful cause it just doesn't need it, by then you need to manage it by yourself.

Let's see how we use it in Stitch here

## Introduction

### Dependency

As the mainstream history library already become the standard router-base library for most of our applications, We will ride on it either.

```js
npm install history -s
```

### Initialization

Register it in Stitch config. We are now supporting 4/5(the version what you are using now) two different history version here.

```js
services: [
  {
    "serviceName": "router_service",
    // if you don't have specific option, we will assign a default Adaptor HistoryV5Adaptor
    "options": {
      "Adaptor": "HistoryV4" | "HistoryV5" 
    }
  },
]
```

Pass history you are using before Stitch started it.

```js
import { createHashHistory } from "history";
import stitch, { navPrompt } from "@stitch/core";

// use hash or browser
const history = createHashHistory();

stitch.config(config, {
  history: history
});

// use the same history into your host
const router = (
  <Provider store={stores}>
    <ConnectedRouter history={history}>
      <Layout childRoutes={routes}>
        <Switch>
          <Route
            key={uuidv5(('hsbc-mfe-host').toString(), ROUTE_KEY_NAMESPACE)}
            path="/mfe/:appName"
            component={props => AppHost({ appName: _get(props, 'match.params.appName', ''), ...props })}
          />
          {routes.map(route => (
            <Route
              key={uuidv5((route.getComponent || route.component || route.path).toString(), ROUTE_KEY_NAMESPACE)}
              exact
              {...route}
              component={LoadAsync}
            />
          ))}
        </Switch>
      </Layout>
    </ConnectedRouter>
    <NavPromptDialog />
  </Provider>
);

```

## Example on MFA

Get it from host context, and pass it to your component.

```jsx
export default function NewInwardPaymentSummary(props) {
  const { services } = props.hostContext;
  const routerService = services.getService('router_service');

  return (
    <PayerMain {...props}>
      <PayerContext.Consumer>
        {(pro) => {
          return (
            <InwardPaymentSummary
              {...props.hostContext}
              history={routerService.history}
              location={routerService.history.location}
              {...pro}
            />
          );
        }}
      </PayerContext.Consumer>
    </PayerMain>
  );
}
```

Use it with history Standard API

```js
class TestComponent extends Component {
  backToSummary = () => {
    const { history } = this.props;
    history.push({
      pathname: constant.PAYER_MANAGEMENT_SUMMARY,
    });
  };
  ....
}
```

## API

Below are the basic methods we opened to developer.
| Name                   | Return   | Description                                         |
| ---------------------- | -------- | --------------------------------------------------- |
| replace(path, [state]) | void     | Replaces the current entry on the history stack     |
| push(path, [state])    | void     | Pushes a new entry onto the history stack           |
| location               | Location | standard location object                            |
| listen                 | void     | Listen for changes to the current location          |
| go(n)                  | void     | Moves the pointer in the history stack by n entries |
| forward                | void     | Equivalent to go(1)                                 |
| block(prompt)          | void     | Prevents navigation                                 |
| back                   | void     | Equivalent to go(-1)                                |
| action                 | void     | The current action (PUSH, REPLACE, or POP)          |


## Support for multiple versions of History
History v5 is the default version we are supporting now.
However, we need to support the existing app which can't update easily.
In that case, you might need to enhance or correct its behaviors by our designated interface.

```js
/**
* In HSBC NET, we are using history v4, so we might be facing some API have different name
* So we override its function(such as the back method), and its behavior align with V5
**/
class HistoryAdaptorV4 extends RouterAdaptor {
  back() {
    this.history.goBack();
  }

  forward() {
    this.history.goForward();
  }

  // ...overide above methods if you are using another library 
}

// Programmable controlling of app config options
stitch.setAppOptions('router_service', {
  ...stitch.getConfigManager().getAppConfig('router_service').options,
  history: new HistoryAdaptorv4();
});

```

[Further more for customer Adaptor](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Routing_Service/6.1.2.1.RouterAdaptor.md)

## Sub Router in MFEApp

Giving a real world module Inward Payment have summary page(/mfe/pending-inward-payments-summary) and its detail record page(/mfe/pending-inward-payments-summary/detail).

In Stitch, we support multiple pages behind in a specific path. which means that we won't re-mount again when the path /mfe/pending-inward-payments-summary change to /mfe/pending-inward-payments-summary/detail.

In this case, We suggest developer implement it in its codebase.

### Example 
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import InwardPaymentSummary from './mfepages/inwardPaymentSummary';
import InwardPaymentDetail from './mfepages/inwardPaymentDetail';
import {
  BrowserRouter as Router,
  HashRouter,
  Switch,
  Route,
} from "react-router-dom";
 
class InwardPayment {
  constructor(component) {
    this.rootDom = null;
    this.hostContext = null;
    this.component = component;
    this.unblock = null;
  }
 
  init(hostContext) {
    this.hostContext = hostContext;
  }
 
  mount(dom) {
    this.rootDom = dom;
    const hostPath = '/mfe/pending-inward-payments-summary';
    ReactDOM.render(
      (
        <HashRouter>
          <Switch>
            <Route exact path={`/mfe/${hostPath}`} component={() => <InwardPaymentSummary  hostContext={this.hostContext}  / >}></Route>
            <Route exact path={`/mfe/${hostPath}/detail`} component={() => <InwardPaymentDetail  hostContext={this.hostContext}  / >}></Route>
          </Switch>
      </HashRouter>
      ), dom);
  }
 
  unmount(dom) {
    ReactDOM.unmountComponentAtNode(this.rootDom || dom);
  }
}
```


## Table of Contents

- [Navigation Prompt](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Routing_Service/6.1.2.2.Navigation_Prompt(Nav_Prompt).md)
- [CustomerAdaptor](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Routing_Service/6.1.2.1.CustomerAdaptor.md)