const pkg = require('./package.json')

export default {
  entry: './src/api/index.js',
  banner: `/*! ${pkg.name} v${pkg.version} */`,
  format: 'ejs',
  dest: pkg.browser,
  external: [ ]
}
