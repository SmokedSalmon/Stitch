/**
 * Not defined - MFE App with specified name is not defined in config
 * Not loaded - MFE App with specified name is defined in config, but not loaded yet.
 * Loaded - MFE App with specified name is loaded and initialized, but not mounted
 * Active - MFE App with specified name is mounted to screen
 * Inactive - MFE App with specified name is unmounted
 */
export const APP_STATUS = {
  NotDefined: 'NotDefined',
  NotLoaded: 'NotLoaded',
  Loaded: 'Loaded',
  Initialized: 'Initialized',
  Active: 'Active',
  Inactive: 'Inactive',
  LoadError: 'LoadError'
}

export const SERVICE_STATUS = {
  starting: 'starting',
  started: 'started',
  stopped: 'stopped'
}

export const REMOTE_APP = 'RemoteApp'

/**
 * Browser mode - Hard navigation
 * Hash mode - soft navigation
 * (Currently NOT supported) Memory mode - non-browser, server side navigation
 */
export const ROUTER_MODE_BROWSER = 'browser'
export const ROUTER_MODE_HASH = 'hash'
// export ROUTER_MODE_MEMORY = 'memory';

// built-in system services name:
export const ROUTER_SERVICE = 'router_service'
export const MESSAGE_SERVICE = 'message_service'
export const STYLE_SERVICE = 'style_service'

export const MAX_SERVICE_DEPENDENCY_DEPTH = 10
