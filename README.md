# Stitch
A Wholesale Digital created drop-in UI framework for Web apps.

## Install

Added Stitch to your project:

```console
npm install @stitch/core @stitch/react
```

NOTE: @stitch/* only be released in the following internal nexus registries:
- `https://dsnexus.uk.hibm.hsbc:8081/nexus/content/groups/npm-all/`
- `https://nexus-digital.systems.uk.hsbc:8081/nexus/content/groups/npm-all/`

## Table of Contents

- [Introduction](/docs/1.Introduction.md)
- Getting Started
  - [Installation](/docs/2.Getting_Started/2.1.Installation.md)
  - [Configuration](/docs/2.Getting_Started/2.2.Configuration.md)
  - [Integration](/docs/2.Getting_Started/2.3.Integration.md)
- [Config Schema](/docs/3.Config_Schema.md)
- [API Reference](/docs/4.API.md)
- [MFE App](/docs/5.MFE_App/index.md)
  - [Interface](/docs/5.MFE_App/5.1.Interface.md)
  - [Host Context](/docs/5.MFE_App/5.2.Host_Context.md)
  - [Webpack Config](/docs/5.MFE_App/5.3.Webpack_Config.md)
  - [Deployment](/docs/5.MFE_App/5.4.Deployment.md)
- [Services](/docs/6.Services/index.md)
  - [System Service](/docs/6.Services/6.1.System_Service/index.md)
  - [Lib Service](/docs/6.Services/6.2.Lib_Service.md)
  - [Customized Service](/docs/6.Services/6.3.Customized_Service/index.md)
- Best Practices
  - [Shared Dependencies](/docs/7.Best_Practice/7.1.Shared_Dependencies.md)
  - [Styling](/docs/7.Best_Practice/7.2.Styling.md)

## Developer guide

Use `yarn` to start monorepo.

```console
yarn install
```

### HSBC Laptop group policy issues

If you encounter the following error message:

```console
...
This program is blocked by group policy. For more information, contact your system administrator.
...
```

Please run the specific install script manually:

```console
npm run install:fix
```
