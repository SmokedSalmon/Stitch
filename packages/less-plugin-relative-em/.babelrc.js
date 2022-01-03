const semver = require('semver')

const rootPkg = require('../../package.json')

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: semver.minVersion(rootPkg.engines.node).version
        }
      }
    ]
  ],
  plugins: [
    '@babel/proposal-export-default-from'
  ]
}
