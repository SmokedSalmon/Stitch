import React, { useState, useLayoutEffect, useRef } from 'react'
import { kebabCase } from 'lodash'

import { renderApp, cleanApp } from '@stitch/core'

const AppHost = (props) => {
  const [hostID, setHostID] = useState('')
  const { appName = '' } = props
  const hostElement = useRef(null)

  useLayoutEffect(() => {
    const currentHostID = `hsbc-mfe-host-${kebabCase(appName)}`

    setHostID(currentHostID)

    if (hostID === currentHostID && hostElement.current) {
      // renderApp is direct DOM change NOT via react
      renderApp(hostElement.current, appName)
    }

    return () => {
      if (hostID === currentHostID && hostElement.current) {
        cleanApp(hostElement.current, appName)
      }
    }
  }, [appName, hostID])

  if (!hostID) {
    return (
      <div>
        <h2>Loading {appName}....</h2>
      </div>
    )
  }

  return <div id={hostID} ref={hostElement} />
}

export default AppHost
