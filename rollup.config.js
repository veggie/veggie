import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'

const pkg = require('./package.json')
const packageBanner = `/*! ${pkg.name} v${pkg.version} */`
const binBanner = '#!/usr/bin/env node'

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
  // Server
  {
    banner: packageBanner,
    external,
    input: './src/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [ json(), babel(), nodeResolve() ]
  },

  // API
  {
    banner: packageBanner,
    input: './src/fetchClientApi.js',
    name: 'veggie',
    output: { file: pkg.browser, format: 'umd' },
    plugins: [ babel(), nodeResolve() ]
  },

  // `veg` bin
  {
    banner: binBanner,
    external,
    input: './src/bin/veg.js',
    output: { file: pkg.bin.veg, format: 'cjs' },
    plugins: [ json(), babel(), nodeResolve() ]
  }
]
