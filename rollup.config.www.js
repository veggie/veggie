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
    'net',
    'repl',
    'meow'
  ],
  onwarn (message) {
    if (!/eval/.test(message)) {
      console.error(message)
    }
  }
}
