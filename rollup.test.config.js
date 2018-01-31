import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import istanbul from 'rollup-plugin-istanbul'
import nodeResolve from 'rollup-plugin-node-resolve'

const external = require('repl')._builtinLibs

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
      commonjs(),
      nodeResolve()
    ]
  }
]
