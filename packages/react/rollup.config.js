import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'

import * as pkg from './package.json'

export default {
  external: [
    /core-js\//,
    /@babel\/runtime/,
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies)
  ],
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named'
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [
    json(),
    resolve({
      extensions: ['.js', '.jsx']
    }),
    babel({
      exclude: /node_modules/,
      babelHelpers: 'runtime'
    }),
    commonjs(),
    cleanup()
  ]
}
