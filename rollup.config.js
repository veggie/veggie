import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import commonjs from 'rollup-plugin-commonjs'

const pkg = require('./package.json')
const packageBanner = `/*! ${pkg.name} v${pkg.version} */`
const binBanner = '#!/usr/bin/env node'
const external = require('repl')._builtinLibs.concat('depd')

export default [
  // Server
  {
    input: './src/index.js',
    output: [
      { banner: packageBanner, file: pkg.main, format: 'cjs' },
      { banner: packageBanner, file: pkg.module, format: 'es' }
    ],
    plugins: [ json(), babel(), commonjs(), nodeResolve() ],
    external
  },

  // API
  {
    input: './src/clientEntry.js',
    output: { banner: packageBanner, file: pkg.browser, format: 'umd', name: 'veggie' },
    plugins: [ babel(), nodeResolve() ]
  },

  // `veg` bin
  {
    external,
    input: './src/bin/veg.js',
    output: { banner: binBanner, file: pkg.bin.veg, format: 'cjs' },
    plugins: [ json(), babel() ]
  }
]
