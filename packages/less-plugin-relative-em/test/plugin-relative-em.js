const less = require('less')
const lessTest = require('less/test/less-test')
const lessTester = lessTest()
const stylize = less.lesscHelper.stylize

const plugin = require('../src').default

// enable development mode for RemWarning
process.env.NODE_ENV = 'development'

console.log(stylize('LESS - plugin-relative-em', 'underline') + '\n')

lessTester.runTestSet(
  {
    plugins: [plugin]
  },
  // path related to node_modules/@less/test-data
  '../../../../packages/less-plugin-relative-em/test-data/'
)
