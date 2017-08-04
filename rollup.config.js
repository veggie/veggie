const pkg = require('./package.json')

export default {
  entry: './src/index.js',
  banner: `/*! ${pkg.name} v${pkg.version} */`,
  targets: [{
    format: 'es',
    dest: pkg.module
  }, {
    format: 'cjs',
    dest: pkg.main
  }],
  external: [
    'body-parser',
    'express',
    'glob',
    'path',
    'fs',
    'net',
    'repl',
    'url'
  ],
  onwarn (message) {
    if (!/eval/.test(message)) {
      console.error(message)
    }
  }
}
