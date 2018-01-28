import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import istanbul from 'rollup-plugin-istanbul'

const external = [
  'body-parser',
  'chalk',
  'crypto',
  'express',
  'fs',
  'get-port',
  'glob',
  'http',
  'meow',
  'net',
  'path',
  'path-to-regexp',
  'repl',
  'url',
  'uuid'
]

export default [
  // Test server
  {
    external,
    input: './test/index.js',
    output: { file: './dist/veggie.test.js', format: 'cjs' },
    plugins: [
      json(),
      istanbul({
        include: 'src/**/*.js'
      }),
      babel(),
      nodeResolve()
    ]
  }
]
