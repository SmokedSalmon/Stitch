import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    exports: 'default'
  },
  plugins: [
    resolve(),
    babel({ babelHelpers: 'inline' }),
    commonjs(),
    cleanup()
  ]
}
