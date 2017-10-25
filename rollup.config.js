import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

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
    entry: './src/index.js',
    banner: packageBanner,
    targets: [
      { dest: pkg.main, format: 'cjs' },
      { dest: pkg.module, format: 'es' }
    ],
    plugins: [ babel(), nodeResolve() ],
    external
  },

  // API
  {
    entry: './src/fetchClientApi.js',
    banner: packageBanner,
    format: 'cjs',
    plugins: [ babel(), nodeResolve() ],
    dest: pkg.browser
  },

  // `veg-connect` bin
  {
    entry: './src/bin/repl.js',
    banner: binBanner,
    format: 'cjs',
    dest: './bin/veg-connect',
    plugins: [ babel(), nodeResolve() ],
    external
  },

  // `veg` bin
  {
    entry: './src/bin/www.js',
    banner: binBanner,
    format: 'cjs',
    dest: './bin/veg',
    plugins: [ babel(), nodeResolve() ],
    external
  }
]
