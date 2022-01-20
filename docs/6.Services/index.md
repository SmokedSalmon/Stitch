# Services
Services are shared tools to provide consistent and re-usable features for all Micro-frontend Applications under various channels.

-------------------------------------------------
## Types of Services
By usage, criticality and provider, Services are categorized in 3 types.

* ### **System service**  

Fundamental features used for most scenarios, logic are highly identical across channels  
>See [Services - System Service](./6.1.System_Service) for complete guide


***Provider***: Stitch core  
***Availability***: All MFAs & Main Application  
***When to load***: Upon Stitch starts, loaded synchronously  
***Example***: `Style service`, `message service`, `router service`, `Entitlement service`, `session service` & API layer

* ### **Lib service**

Features that shared by a small group of MFAs that serve for the same larger module or business function.


Logic may have significant difference across various channels. It cannot be provided by either the Stitch core nor the channel. It is owned & maintained by Application team that uses it.  
>See [Services - Library Service](./6.2.Lib_Service) for complete guide

***Provider***: Micro-Frontend application owner  
***Availability***: MFAs that require them & Main Application  
***When to load***: If `autoLoad` set to `true`, it will be loaded **Asynchronously** upon Stitch starts. If `autoLoad` set to `false`, it will load & start on demand

* ### **Customized service**

Fundamental features used for most scenarios, however logic have significant difference across different channels. Its implementation must be specified by the channel's Main application/App Shell  

>See [Services - Customized Service](./6.3.Customized_Service) for complete guide

***Provider***: Main application  
***Availability***: All MFAs & Main Application  
***When to load***: Upon Stitch starts, loaded synchronously  
***Example***: `User profile service`, SEO & analytical tools, localization service (`G11n`, `I18n`)

-------------------------------
## Life Cycle
Service typically goes through 3 phases until it reach the end user - MFA Application

**1. Load phase**  
**System service** will be imported at build time as it resides in the same source base of `@stitch/core`   
**Auto-load Library service** will be fetched remote source upon `stitch.start()`  
**On-demand Library service** will be fetched from remote source upon initialization of any *MFA that requires it*  
**Customized service** will be injected by Main application into Stitch at any time.

**2. Start phase**  
When loaded, a service module iterates all its dependent services (direct & nested) and start them in order according their dependency relationship.
>See [Service dependency and start sequence](./6.4.Service_dependency_and_start_sequence) for more detail

Service with no dependencies will start **immediately** when loaded

**3. Context Binding & Injection**  
Service module requires **MFA context** (such as App information, channel-specific parameters) to properly provide its feature to its user.
When started, it will be bound with MFA context, **instantiated** and is **injected** into MFA's Host context.
it can then be accessed by `App_Instance.hostContext['Service_name']` with all its defined methods and properties.
