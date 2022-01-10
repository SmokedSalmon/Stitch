import React, { useState, useEffect, useRef } from 'react'
import { kebabCase } from 'lodash'

import { renderApp, cleanApp } from '@stitch/core'

const AppHost = (props) => {
  const [hostID, setHostID] = useState('')
  const { appName = '' } = props
  const hostElement = useRef(null)
  useEffect(() => {
    setHostID(`hsbc-mfe-host-${kebabCase(appName)}`)
    // renderApp is direct DOM change NOT via react
    hostElement.current && renderApp(hostElement.current, appName)
    return () => {
      hostElement.current && cleanApp(hostElement.current, appName)
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
