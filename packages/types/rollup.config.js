import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'

import * as pkg from './package.json'

export default {
  external: [
    /core-js\//,
    /@babel\/runtime/,
    ...Object.keys(pkg.dependencies)
  ],
  input: 'src/index.ts',
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
    typescript({ tsconfig: './tsconfig.json' }),
    babel({
      exclude: /node_modules/,
      extensions: ['.js', '.ts'],
      babelHelpers: 'runtime',
      rootMode: 'upward'
    }),
    commonjs(),
    cleanup()
  ]
}
