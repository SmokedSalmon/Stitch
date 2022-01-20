const loadModule = (() => {
  const inProgress = {}
  const dataWebpackPrefix = '@hsbc-mfe/host:' // loadScript function to load a script via script tag
  return (url, done, key, chunkId) => {
    console.log('-------loading module-----------')
    if (inProgress[url]) {
      inProgress[url].push(done)
      return
    }
    let script, needAttach
    if (key !== undefined) {
      const scripts = document.getElementsByTagName('script')
      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i]
        if (
          s.getAttribute('src') === url ||
                    s.getAttribute('data-webpack') === dataWebpackPrefix + key
        ) {
          script = s
          break
        }
      }
    }
    if (!script) {
      needAttach = true
      script = document.createElement('script')
      script.charset = 'utf-8'
      script.timeout = 120
      script.setAttribute('data-webpack', dataWebpackPrefix + key)
      script.src = url
    }
    inProgress[url] = [done]
    const onScriptComplete = (prev, event) => {
      // avoid mem leaks in IE.
      script.onerror = script.onload = null
      clearTimeout(timeout)
      const doneFns = inProgress[url]
      delete inProgress[url]
      script.parentNode && script.parentNode.removeChild(script)
      doneFns && doneFns.forEach((fn) => fn(event))
      if (prev) return prev(event)
    }
    const timeout = setTimeout(
      onScriptComplete.bind(null, undefined, {
        type: 'timeout',
        target: script
      }),
      120000
    )
    script.onerror = onScriptComplete.bind(null, script.onerror)
    script.onload = onScriptComplete.bind(null, script.onload)
    needAttach && document.head.appendChild(script)
  }
})()

export function loadScriptAsync (url, libName, name) {
  return new Promise((resolve, reject) => {
    if (typeof window[libName] !== 'undefined') return resolve()

    const done = (event) => {
      if (typeof window[libName] !== 'undefined') return resolve()
      const errorType = event && (event.type === 'load' ? 'missing' : event.type)
      const realSrc = event && event.target && event.target.src
      const error = {}
      error.message = 'Loading script failed.\n(' + errorType + ': ' + realSrc + ')'
      error.name = 'ScriptExternalLoadError'
      error.type = errorType
      error.request = realSrc
      reject(error)
    }

    return loadModule(url, done, name)
  })
}

export default loadModule
