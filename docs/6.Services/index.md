# Services
Services are shared tools to provide consistent and re-usable features for all Micro-frontend Applications under various channels.

-------------------------------------------------
## Types of Services
By usage, criticality and provider, Services are categorized in 3 types.

* ### **System service**  
Fundamental features used for most scenarios, logic are highly identical across channels  
>See [Services - System Service](./6.1.System_Service) for complete guide

***Provider***: Stitch core  
***When to load***: Upon Stitch starts, loaded synchronously  
***Example***: `Style service`, `message service`, `router service`

* ### **Library service**
Features that shared by a small group of MFAs that serve for the same larger module or business function.  
It cannot be provided by Stitch core due to implementation are highly different across channels.  
The modules resides in the same remote bundle of the MFA that uses it. The same MFA team is responsible for its entire delivery cycle and maintenance   
>See [Services - Library Service](./6.2.Lib_Service) for complete guide

***Provider***: Micro-Frontend application owner  
***When to load***: If `autoLoad` set to `true`, it will be loaded **Asynchronously** upon Stitch starts. If `autoLoad` set to `false`, it will load & start on demand

* ### **Customized service**
Channel-specific features, tts implementation must be specified by the channel's Main application/App Shell    
>See [Services - Customized Service](./6.3.Customized_Service) for complete guide

***Provider***: Main application  
***When to load***: Upon Stitch starts, loaded synchronously  
***Example***: `User profile service`, SEO & analytical tools, localization service (`G11n`, `I18n`)

>:warning: Although most system service auto-load Library services are loaded & started after Stitch starts
ANY service must be **explicitly required** to be used by MFA

-------------------------------
## Life Cycle
Service typically goes through 3 phases before it is usable for it user

**1. Load phase**  
**System service** will be imported at build time as it resides in the same source base of `@stitch/core`   
**Auto-load Library service** will be fetched remote source upon `Stitch start()`  
**Library service** will be fetched from remote source upon initialization of any *MFA that requires it*  
**Customized service** Injected by Main application upon `Stitch start()`. 

**2. Start phase**  
After loaded, service starts for initialization such as acquiring context(Synchronous) or fetching assets (Asynchronous)  
Service with no dependencies will start **immediately** when loaded  
Otherwise, service it iterates all its dependent services (direct & nested) and starts them in order according their dependency relationship.  
>See [Service dependency and start sequence](./6.4.Service_dependency_and_start_sequence) for more detail

**3. Context Binding & Injection**  
Service module requires **MFA context** (such as App information, channel-specific parameters) to properly provide its feature to its user.
When started, it will be bound with MFA context, **instantiated** and is **injected** into MFA's Host context.
it can then be accessed by `App_Instance.hostContext['Service_name']` with all its defined methods and properties.
