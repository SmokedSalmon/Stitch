# Services
> :warning: This is Dev Manual for Stitch Service module

## Overall Schematics (under review)
![Services Schematics](https://alm-confluence.systems.uk.hsbc/confluence/download/attachments/839689601/Services.png?version=3&modificationDate=1636704290000&api=v2)

## Example - Adding a System Service
Consider you have a simple service that reports the weather of today, it is a common shared feature and should be injected it into every MFE application by our Stitch. It looks like this:

```javascript
export function weather () {
  console.log('[Dummy weather service]: Today is windy')
}
```

It should be served as a **System** Service, which is integrated within Stitch, instantiated and injected upon **Stitch starts**.  
* Commit your service's code into Stitch codebase following xxxx practice **[TO BE PROVIDED]**  
  You must put your code under **/mfe/services/** directory, and make sure there is an entry that exports your entire service's definition as a module. E.g.  
  ![System service 1](https://alm-confluence.systems.uk.hsbc/confluence/download/thumbnails/839689601/image2021-11-9_10-51-30.png?version=1&modificationDate=1636426290000&api=v2)
  or
  ![System service 2](https://alm-confluence.systems.uk.hsbc/confluence/download/thumbnails/839689601/image2021-11-9_10-52-34.png?version=1&modificationDate=1636426354000&api=v2)

* Register it in mfe **Config** and import it to **Service Manager**  
  Stitch is a config-driven framework, you must register your service into **mfeConfig.json**  
  It is managed by Config center, please refer here **[TO BE PROVIDED]** to register your service entry:  
  ![System service 2](https://alm-confluence.systems.uk.hsbc/confluence/download/thumbnails/839689601/image2021-11-9_11-51-37.png?version=1&modificationDate=1636429897000&api=v2)
  
> :warning: Please note, a system service is **ALWAYS autoLoad, injectable and protected**. Changing these 3 options has **NO** effect to the system service's behavior

  In **/mfe/serviceManger/ServiceManager.js**, import your service module and expose it as one of the entry of serviceServices. Service Manger will then recognizes it during Stich's bootup phase and inject it as it is needed
```javascript
...
// imports
import { xxx, xxx, dummy_weather_service } from '../services'
...
const systemServices = {
  ...,
  dummy_weather_service
}
...
```

* Use it by accessing it with the registered service name at the MFE application's **hostContext.services** object. Please refer here [Accessing Registered Service]()

## Example - Adding a Library Service
> :warning: By providing a Library Service, please aware you and your team are the sole owner of it, and it is mostly shared only within the same channel of community. You should invest effort to  maintain the interface and related document for potential user of your service, and conduct proper error handle and protection.

With the same dummy service above, but this time your team decides that weather service should be maintained in a different remote library so that it can be updated/enhanced/iterate outside Stitch release cycle.

* **Export your service definition in your team's bundle (Library) using Webpack's module federation** guideline **[TO BE PROVIDED]**, 
  Currently MFE applications and remote services are integrated by Stitch with under webpack module federation. Your service definition is host at a separated repository, compiled, built into a bundle and exported using certain Webpack config.  
  Your dummy weather service now lives at another repository this time, exported at <your repo>/src/index.js which served as your bundle's entry point. In the example webpack config shown below, it lives within your team's bundle - **remoteEntry.js**  
  ![Library service 1](https://alm-confluence.systems.uk.hsbc/confluence/download/attachments/839689601/image2021-11-9_11-40-47.png?version=1&modificationDate=1636429247000&api=v2)

  Further config your webpack to expose your service as a webpack federated module,  
  ![Library service 2](https://alm-confluence.systems.uk.hsbc/confluence/download/thumbnails/839689601/image2021-11-9_11-46-25.png?version=1&modificationDate=1636429586000&api=v2)
  
  exposed name to be confirmed, please use "services" a the moment, it is extracted by Stitch service manager to import any Library Services, same mechanism that application manager imports an application from a remote library  
  
* Register it in mfe Config
  It is managed by Config center, please refer here **[TO BE PROVIDED]** to register your service entry:  
  ![Library service 3](https://alm-confluence.systems.uk.hsbc/confluence/download/thumbnails/839689601/image2021-11-9_11-50-56.png?version=1&modificationDate=1636429856000&api=v2)
  
  Make sure the type to be "**Lib**", and assign those **autoLoad, injectable** and protected options to suit your need


## Example - Adding a Customized Service
'**addService**' method of Service manager is designed to add Customized Service into the Stitch
> :warning: Because the instance of the customized service can be any form, the Stitch will NOT instantized it before loading any MFE application. Instead, the original service module will be injected directly. As a result, at current implementation, Customized service cannot access application context during injection.
We suggest that It should be context-irrelevant, otherwise you have to work another way to acquire the running application context.

One example - router service:
```javascript
function initRouter (router) {
  ...
  // "router" is provided by the main application, instantiated with its context already
  serviceManager.addService('router', router)
}
````


## Accessing Registered Service
Usable service instances are injected into application's **hostContext.services**, it can be accessed via its "**getService**" method
```<some app>.hostContext.services.getService('your service name')```
