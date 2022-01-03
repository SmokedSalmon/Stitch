import React, { useState, useEffect, useRef } from 'react'
import { kebabCase } from 'lodash'

import { renderApp, cleanApp } from '@stitch/core'

const AppHost = (props) => {
  const [hostID, setHostID] = useState('')
  const { appName = '' } = props
  const hostElement = useRef(null)
  console.log(props)
  useEffect(() => {
    setHostID(`hsbc-mfe-host-${kebabCase(appName)}`)
    // renderApp is direct DOM change NOT via react
    // use 'setTimeout' to wait after render cycle so that useRef().current is assigned with the DOM element
    // TODO investigate to use better solutions, such as separate useEffect call
    setTimeout(() => {
      hostElement.current && renderApp(hostElement.current, appName)
    })
    return () => {
      cleanApp(hostElement.current, appName)
    }
  }, [appName])

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
