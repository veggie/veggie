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
  'url'
]

export default [
  // Server
  {
    input: './src/index.js',
    banner: packageBanner,
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [ json(), babel(), nodeResolve() ],
    external
  },

  // API
  {
    input: './src/fetchClientApi.js',
    banner: packageBanner,
    name: 'veggie',
    plugins: [ babel(), nodeResolve() ],
    output: {
      file: pkg.browser,
      format: 'umd'
    }
  },

  // `veg` bin
  {
    input: './src/bin/veg.js',
    banner: binBanner,
    output: {
      file: './bin/veg',
      format: 'cjs'
    },
    plugins: [ json(), babel(), nodeResolve() ],
    external
  }
]
