import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')
const packageBanner = `/*! ${pkg.name} v${pkg.version} */`
const binBanner = '#!/usr/bin/env node'

const externals = [
  'body-parser',
  'express',
  'glob',
  'path',
  'path-to-regexp',
  'http',
  'fs',
  'net',
  'meow',
  'repl',
  'url',
  'get-port'
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
    plugins: [ babel() ],
    external: externals
  },

  // API
  {
    entry: './src/api/index.js',
    banner: packageBanner,
    format: 'cjs',
    plugins: [ babel() ],
    dest: pkg.browser
  },

  // `repl` bin
  {
    entry: './src/bin/repl.js',
    banner: binBanner,
    format: 'cjs',
    dest: './bin/repl',
    plugins: [ babel() ],
    external: externals
  },

  // `www` bin
  {
    entry: './src/bin/www.js',
    banner: binBanner,
    format: 'cjs',
    dest: './bin/www',
    plugins: [ babel() ],
    external: externals
  }
]
