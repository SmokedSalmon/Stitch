import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'

import dynamicRequireVars from './rollup-plugin-dynamic-require-vars'

import * as pkg from './package.json'

export default [
  {
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
      resolve(),
      babel({
        exclude: /node_modules/,
        babelHelpers: 'runtime',
        rootMode: 'upward'
      }),
      dynamicRequireVars(),
      commonjs(),
      cleanup()
    ]
  },
  {
    input: 'src/constants.js',
    output: {
      file: 'dist/constants.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      cleanup()
    ]
  }
]
