const dummyConfigManager = jest.requireActual('../../../src/configManager/ConfigManager').default
dummyConfigManager.updateConfig(
  {
    "org": {
      "product": "New UI"
    },
    "env": "Dev",
    "routerPath": "mfe",
    "hosts": [
      {
        "hostName": "SDE3",
        "server": "cdn.sde3-c.hsbcnet.com",
        "publicPath": "/uims/static-dl/public/echannel/features/mfe"
      },
      {
        "hostName": "SDE4",
        "server": "cdn.sde4-c.hsbcnet.com",
        "publicPath": "/uims/static-dl/public/echannel/features/mfe"
      }
    ],
    "libs": [
      {
        "libName": "ws_credit_and_lending",
        "resource": "https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js",
        "styles": [{
          "styleName": "ws_credit_and_lending_style",
          "resource": "https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/style.css"
        }],
        "apps": [
          {
            "name": "wcl_lending_authorisation",
            "routerName": ["lendingAuthorisation"]
          },
          {
            "name": "wcl_create_lending",
            "routerName": ["createLending"]
          },
          {
            "name": "wcl_dashboard",
            "routerName": ["dashboard"],
            "styles": ["ws_credit_and_lending_style"]
          }
        ],
        "services": [{
          "serviceName": "dummy_wcl_service",
          "autoLoad": false,
          "disabled": false,
          "protected": true
        }]
      },
      {
        "libName": "dummy_lib_services",
        "resource": "https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/dummy_services/v1/remoteEntry.js",
        "services": [
          {
            "serviceName": "dummy_financial_service",
            "autoLoad": false,
            "disabled": false,
            "protected": true
          },
          {
            "serviceName": "dummy_task_service",
            "autoLoad": false,
            "disabled": false,
            "protected": true
          },
          {
            "serviceName": "dummy_weather_service",
            "autoLoad": false,
            "disabled": false,
            "protected": true
          }
        ]
      },
      {
        "libName": "payerManagement",
        "resource": "http://localhost:3002/remoteEntry.js",
        "apps": [
          {
            "name": "pending-inward-payments-summary",
            "routerName": ["pending-inward-payments-summary"]
          },
          {
            "name": "payer-management-summary",
            "routerName": ["payer-management-summary"]
          }
        ]
      }
    ],
    "services": [{
      "serviceName": "router_service",
      "options": {
        "adaptor": "HistoryV4"
      }
    }]
  }
)

export default dummyConfigManager
