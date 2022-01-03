module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  preset: null,
  testEnvironment: 'jsdom',
  testRegex: '(/.*\\.(test|spec))\\.js$',
  transform: {
    '\\.jsx?$': ['babel-jest', { rootMode: 'upward' }]
  }
};
