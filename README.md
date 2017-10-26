
# veggie

[![Build Status](https://travis-ci.org/micburks/veggie.svg?branch=master)](https://travis-ci.org/micburks/veggie)
[![Coverage Status](https://coveralls.io/repos/github/micburks/veggie/badge.svg?branch=master)](https://coveralls.io/github/micburks/veggie?branch=master)
[![NPM Version](https://img.shields.io/npm/v/veggie.svg)](https://www.npmjs.com/package/veggie)
[![License](https://img.shields.io/npm/l/rollup.svg)](https://github.com/micburks/veggie/blob/master/LICENSE)

> *Eat your damn vegetables*

Interactive mock server for profiling user scenarios


### Installation

```bash
npm i -D veggie
```


## Add mock data routes to existing Express server

### Create routes

Export an object that keys your service url to either:

- a static JSON object
- an express route that completes the request
- a file path

If you are using a path to a JSON file, the file will be loaded every time this
url is reached. This allows you to edit your JSON file and have it sent without
restarting your development server.


### Add express routes to webpack-dev-server

```javascript
// webpack.config.js
const veggie = require('veggie')
// ...
  devServer: {
    setup(app) {
      app.use(veggie.router({ dir: 'services/**/*.js' }))
    }
  }
// ...
```


## Run stand alone server

### Run the server

```bash
veg -d services/**/*.js -p 1337 -t 1000
```

to serve from port 1337


### Add proxies to webpack-dev-server

```javascript
// webpack.config.js
// ...
  devServer: {
    proxy: {
      '/services': 'http://localhost:1337'
    }
  }
// ...
```


## Use a REPL to access your live services

When using the mock router, you may want to change service responses without
restarting the dev server. All veggie profile methods in return 

```bash
npm  i -g veg-connect
```


## Save profiles

TODO


## Use in tests

The mock middleware can be used in karma via the following

```javascript
// karma.conf.js
const mockMiddleware = require('veggie').middleware
// ...
  middleware: ['veggie'],
  plugins: [
    'karma-*',
    {
      'middleware:veggie': [ 'factory', mockMiddleware ]
    }
  ]
// ...
```

This middleware will spawn an express server, as the binary would, and proxies
all requests to that.


## Changing profiles in tests

If you want to change profiles during tests, you will need to include
veggie from the `browser` field.

All veggie profile methods will return promises


```javascript
// Note:
// When bundling for testing in browsers, your bundler will need to be configured
// to look for `browser` field of this package
import veggie from 'veggie'
```

#### block
```javascript
before(() => {
  return veggie.block('getUser')
})
```

#### blockAll
```javascript
before(() => {
  return veggie.blockAll()
})
```

#### reset
```javascript
before(() => {
  return veggie.reset('getUser')
})
```

#### resetAll
```javascript
before(() => {
  return veggie.resetAll()
})
```

#### loadProfile
```javascript
before(() => {
  return veggie.loadProfile('adminUser')
})
```


## Configuration options

TODO
