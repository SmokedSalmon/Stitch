const dummyConfigManagerData = {
  state: {},
  config: {
    org: {
      product: 'New UI'
    },
    env: 'Dev',
    routerPath: 'mfe',
    hosts: [
      {
        hostName: 'SDE3',
        server: 'cdn.sde3-c.hsbcnet.com',
        publicPath: '/uims/static-dl/public/echannel/features/mfe'
      },
      {
        hostName: 'SDE4',
        server: 'cdn.sde4-c.hsbcnet.com',
        publicPath: '/uims/static-dl/public/echannel/features/mfe'
      }
    ],
    libs: [
      {
        libName: 'ws_credit_and_lending',
        resource: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
        styles: [
          {
            styleName: 'ws_credit_and_lending_style',
            resource: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/style.css'
          }
        ],
        apps: [
          {
            name: 'wcl_lending_authorisation',
            routerName: [
              'lendingAuthorisation'
            ]
          },
          {
            name: 'wcl_create_lending',
            routerName: [
              'createLending'
            ]
          },
          {
            name: 'wcl_dashboard',
            routerName: [
              'dashboard'
            ],
            styles: [
              'ws_credit_and_lending_style'
            ]
          }
        ],
        services: [
          {
            serviceName: 'dummy_wcl_service',
            autoLoad: false,
            disabled: false,
            protected: true
          }
        ]
      },
      {
        libName: 'dummy_lib_services',
        resource: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/dummy_services/v1/remoteEntry.js',
        services: [
          {
            serviceName: 'dummy_financial_service',
            autoLoad: false,
            disabled: false,
            protected: true
          },
          {
            serviceName: 'dummy_task_service',
            autoLoad: false,
            disabled: false,
            protected: true
          },
          {
            serviceName: 'dummy_weather_service',
            autoLoad: false,
            disabled: false,
            protected: true
          }
        ]
      },
      {
        libName: 'payerManagement',
        resource: 'http://localhost:3002/remoteEntry.js',
        apps: [
          {
            name: 'pending-inward-payments-summary',
            routerName: [
              'pending-inward-payments-summary'
            ]
          },
          {
            name: 'payer-management-summary',
            routerName: [
              'payer-management-summary'
            ]
          }
        ]
      }
    ],
    services: [
      {
        serviceName: 'router_service',
        options: {
          adaptor: 'HistoryV4'
        }
      }
    ]
  },
  hosts: {
    SDE3: 'undefined://cdn.sde3-c.hsbcnet.com/uims/static-dl/public/echannel/features/mfe',
    SDE4: 'undefined://cdn.sde4-c.hsbcnet.com/uims/static-dl/public/echannel/features/mfe'
  },
  styles: {
    stitch_mfe_style_1: {
      uniqueID: 'stitch_mfe_style_1',
      styleName: 'ws_credit_and_lending_style',
      libName: 'ws_credit_and_lending',
      styleUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/style.css'
    }
  },
  apps: {
    lendingAuthorisation: {
      name: 'wcl_lending_authorisation',
      libName: 'ws_credit_and_lending',
      libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
      routerName: [
        'lendingAuthorisation'
      ],
      styles: [],
      options: {}
    },
    createLending: {
      name: 'wcl_create_lending',
      libName: 'ws_credit_and_lending',
      libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
      routerName: [
        'createLending'
      ],
      styles: [],
      options: {}
    },
    dashboard: {
      name: 'wcl_dashboard',
      libName: 'ws_credit_and_lending',
      libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
      routerName: [
        'dashboard'
      ],
      styles: [
        {
          uniqueID: 'stitch_mfe_style_1',
          styleName: 'ws_credit_and_lending_style',
          libName: 'ws_credit_and_lending',
          styleUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/style.css'
        }
      ],
      options: {}
    },
    'pending-inward-payments-summary': {
      name: 'pending-inward-payments-summary',
      libName: 'payerManagement',
      libUrl: 'http://localhost:3002/remoteEntry.js',
      routerName: [
        'pending-inward-payments-summary'
      ],
      styles: [],
      options: {}
    },
    'payer-management-summary': {
      name: 'payer-management-summary',
      libName: 'payerManagement',
      libUrl: 'http://localhost:3002/remoteEntry.js',
      routerName: [
        'payer-management-summary'
      ],
      styles: [],
      options: {}
    }
  },
  libs: {
    ws_credit_and_lending: {
      name: 'ws_credit_and_lending',
      libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
      styles: {
        ws_credit_and_lending_style: {
          uniqueID: 'stitch_mfe_style_1',
          styleName: 'ws_credit_and_lending_style',
          libName: 'ws_credit_and_lending',
          styleUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/style.css'
        }
      },
      apps: {
        lendingAuthorisation: {
          name: 'wcl_lending_authorisation',
          libName: 'ws_credit_and_lending',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
          routerName: [
            'lendingAuthorisation'
          ],
          styles: [],
          options: {}
        },
        createLending: {
          name: 'wcl_create_lending',
          libName: 'ws_credit_and_lending',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
          routerName: [
            'createLending'
          ],
          styles: [],
          options: {}
        },
        dashboard: {
          name: 'wcl_dashboard',
          libName: 'ws_credit_and_lending',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
          routerName: [
            'dashboard'
          ],
          styles: [
            {
              uniqueID: 'stitch_mfe_style_1',
              styleName: 'ws_credit_and_lending_style',
              libName: 'ws_credit_and_lending',
              styleUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/style.css'
            }
          ],
          options: {}
        }
      },
      services: {
        dummy_wcl_service: {
          serviceName: 'dummy_wcl_service',
          type: 'LIB',
          libName: 'ws_credit_and_lending',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/wcl/v2/remoteEntry.js',
          autoLoad: false,
          disabled: false,
          protected: true,
          options: {}
        }
      }
    },
    dummy_lib_services: {
      name: 'dummy_lib_services',
      libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/dummy_services/v1/remoteEntry.js',
      styles: {},
      apps: {},
      services: {
        dummy_financial_service: {
          serviceName: 'dummy_financial_service',
          type: 'LIB',
          libName: 'dummy_lib_services',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/dummy_services/v1/remoteEntry.js',
          autoLoad: false,
          disabled: false,
          protected: true,
          options: {}
        },
        dummy_task_service: {
          serviceName: 'dummy_task_service',
          type: 'LIB',
          libName: 'dummy_lib_services',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/dummy_services/v1/remoteEntry.js',
          autoLoad: false,
          disabled: false,
          protected: true,
          options: {}
        },
        dummy_weather_service: {
          serviceName: 'dummy_weather_service',
          type: 'LIB',
          libName: 'dummy_lib_services',
          libUrl: 'https://hsbcnet-demo-dev.gcp.cloud.hk.hsbc/mfe/dummy_services/v1/remoteEntry.js',
          autoLoad: false,
          disabled: false,
          protected: true,
          options: {}
        }
      }
    },
    payerManagement: {
      name: 'payerManagement',
      libUrl: 'http://localhost:3002/remoteEntry.js',
      styles: {},
      apps: {
        'pending-inward-payments-summary': {
          name: 'pending-inward-payments-summary',
          libName: 'payerManagement',
          libUrl: 'http://localhost:3002/remoteEntry.js',
          routerName: [
            'pending-inward-payments-summary'
          ],
          styles: [],
          options: {}
        },
        'payer-management-summary': {
          name: 'payer-management-summary',
          libName: 'payerManagement',
          libUrl: 'http://localhost:3002/remoteEntry.js',
          routerName: [
            'payer-management-summary'
          ],
          styles: [],
          options: {}
        }
      },
      services: {}
    }
  },
  services: {
    // dummy services
    d1: {
      serviceName: 'd1',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    d2: {
      serviceName: 'd2',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    c1: {
      serviceName: 'c1',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    c2: {
      serviceName: 'c2',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    b1: {
      serviceName: 'b1',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    b2: {
      serviceName: 'b2',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    b3: {
      serviceName: 'b3',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    circular_b4: {
      serviceName: 'circular_b4',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    a1: {
      serviceName: 'a1',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    },
    a2: {
      serviceName: 'a2',
      type: 'SYSTEM',
      disabled: false,
      protected: true,
      options: {}
    }
  }
}

const mock = {
  getAppConfig: () => dummyConfigManagerData.apps,

  getRawConfig: () => dummyConfigManagerData.config,

  getOrgConfig: () => dummyConfigManagerData.config.org,

  getEnv: () => dummyConfigManagerData.config.env,

  getRouterPath: () => dummyConfigManagerData.config.routerPath,

  getGlobalOptions: () => dummyConfigManagerData.config.globalOptions,

  getServiceConfig: () => dummyConfigManagerData.services,

  // Methods to be correctly mocked
  setGlobalOptions: () => {},
  validateConfig: () => true,
  updateConfig: () => {},
  setAppOptions: () => {},
  setServiceOptions: () => {},
  getStyleConfig: (libName, styleName) => dummyConfigManagerData.libs[libName].styles[styleName]
}
export default mock
