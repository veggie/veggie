export default {
  entry: './src/bin/repl.js',
  banner: '#!/usr/bin/env node',
  format: 'cjs',
  dest: './bin/repl',
  external: [
    'meow',
    'net'
  ]
}
