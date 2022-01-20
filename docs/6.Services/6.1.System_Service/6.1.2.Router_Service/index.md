# Router Service

If we are developing a SPA with multiple pages, A router is needed for routing to different pages, passing data from one component to another component.

In this case, the Router should be a single instance serve to those pages and make it consistent with browser behavior.

In Stitch, Router Service was born for serve these purposes:

1. Eliminate different history instances from Host to MFA
2. Establish a consolidated interface to different MFA
3. Give us a much useful advanced API to reduce MFA's development effort.

For more you need to know is, Router Service is an optional service in Stitch.

Why? Because Stitch can be just a tool, in that case, the router is no longer useful cause it just doesn't need it, by then you need to manage it by yourself.

Let's see how we use it in Stitch here

## Introduction

### Dependency

As the mainstream history library already become the standard router-base library for most of our applications, We will ride on it either.

```console
npm install history -s
```

### Configuration

Register it in Stitch config. We are now supporting 4/5(the version what you are using now) two different history version here.

```js
services: [
  {
    name: "router_service",
    // if you don't have specific option, we will assign a default Adaptor HistoryV5Adaptor
    options: {
      Adaptor: "HistoryV4" | "HistoryV5",
    },
  },
];
```

Support version:
| Name      | History Version |
| --------- | --------------- |
| HistoryV4 | ^4.0.0          |
| HistoryV5 | ^5.0.0          |

## Example

Pass the history you are using before Stitch started it.
In Host:

```js
import { createHashHistory } from "history";
import stitch from "@stitch/core";

// use hash or browser
const history = createHashHistory();

stitch.config(config, { history });

const stitchConfigManager = stitch.getConfigManager();

stitch.start();
```

Get it from host context, and pass it to your component.
In MFA:

```jsx
export default function MFAComponent(props) {
  const { services } = props.hostContext;
  const routerService = services.getService("router_service");

  return (
    <PayerMain {...props}>
      <PayerContext.Consumer>
        {(pro) => {
          return (
            <TestComponent
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
  goto = (path) => {
    const { history } = this.props;
    history.push({
      pathname: path,
    });
  };
  // ...
}
```

## Interface

Below are the basic methods we expose in Router Service.

| Name          | Type                                                                                                                                                           | Description                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| history       | [RouterAdaptor](#routeradaptor-interface)                                                                                                                      | The object has the same properties as History V5    |
| navPrompt     | [NavPrompt](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Router_Service/6.1.2.2.NavPrompt.md#interface) | Advance API, Will cover it in another Session       |
| pushApp       | (appName: string, path?: string, state?: obj) => void                                                                                                          | Advance API for navigating to another MFA           |
| replaceApp    | (appName: string, path?: string, state?: obj) => void                                                                                                          | Advance API for navigating to another MFA           |
| getRouterMode | () => 'hash' \| 'browser'                                                                                                                                      | Return which mode history is using
 |

### RouterAdaptor Interface

Follow [the interface](https://v5.reactrouter.com/web/api/history) of the history package.

| Member                 | Type                                   | Description                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action                 | string (readonly)                      | The current action (`PUSH`, `REPLACE`, or `POP`).                                                                                                                                                                                                                                                                                     |
| location               | object (readonly)                      | The current location. May have the following properties:<br/>- `pathname` (string): The path of the URL<br/>- `search` (string): The URL query string<br/>- `hash` (string): The URL hash fragment<br/>- `state` (object): location-specific state that was provided to e.g. push(path, state) when this location was pushed onto the |
| push(path, [state])    | (path: string, state?: object) => void | Pushes a new entry onto the history stack.                                                                                                                                                                                                                                                                                            |
| replace(path, [state]) | (path: string, state?: object) => void | Replaces the current entry on the history stack.                                                                                                                                                                                                                                                                                      |
| go(n)                  | (n: number) => void                    | Moves the pointer in the history stack by n entries.                                                                                                                                                                                                                                                                                  |
| back()                 | () => void                             | Equivalent to go(`-1`).                                                                                                                                                                                                                                                                                                               |
| forward()              | () => void                             | Equivalent to go(`1`).                                                                                                                                                                                                                                                                                                                |
| block(blocker)         | (blocker: function) => void            | Prevents navigation (see [the history docs](https://github.com/remix-run/history/blob/main/docs/blocking-transitions.md))                                                                                                                                                                                                             |
| listen(listener)       | (listener: function) => void           | Listen for changes to the current location (see [the history docs](https://github.com/remix-run/history/blob/main/docs/getting-started.md#listening))                                                                                                                                                                                 |

## Support for multiple versions of History

History v5 is the default version we are supporting now.
However, we need to support the existing app which can't update easily.
In that case, you might need to enhance or correct its behaviors by our designated interface.

[Further more for Customer Router Adaptor](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Router_Service/6.1.2.1.Customer_Adaptor.md)

## Sub Router in MFEApp

Giving a real world module Inward Payment have summary page(/mfe/pending-inward-payments-summary) and its detail record page(/mfe/pending-inward-payments-summary/detail).

In Stitch, we support multiple pages behind in a specific path. which means that we won't re-mount again when the path /mfe/pending-inward-payments-summary change to /mfe/pending-inward-payments-summary/detail.

In this case, We suggest developer implement it in its codebase.

Example reference:

- [Routing Example](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/develop/docs/7.Best_Practice/7.3.Routing_Example.md)

## Table of Contents

- [Navigation Prompt](<https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Router_Service/6.1.2.2.Navigation_Prompt(Navigation_Prompt).md>)
- [Customer Router Adaptor](https://alm-github.systems.uk.hsbc/Net-UI/stitch/blob/HEAD/docs/6.Services/6.1.System_Service/6.1.2.Router_Service/6.1.2.1.Customer_Adaptor.md)
