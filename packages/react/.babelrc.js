const baseConfig = require('../../babel.config');

module.exports = {
  ...baseConfig,
  presets: [
    baseConfig.presets[0],
    '@babel/react'
  ]
};
