const baseJestConfig = require('../../jest.config.js');

module.exports = {
  ...baseJestConfig,
  setupFilesAfterEnv: ['../../jest.setup.js']
};
