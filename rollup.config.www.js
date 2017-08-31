export default {
  entry: './src/bin/www.js',
  banner: '#!/usr/bin/env node',
  format: 'cjs',
  dest: './bin/www',
  external: [
    'body-parser',
    'express',
    'glob',
    'fs',
    'path',
    'net',
    'repl',
    'meow',
    'get-port'
  ],
  onwarn (message) {
    if (!/eval/.test(message)) {
      console.error(message)
    }
  }
}
