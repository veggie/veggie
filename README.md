
# veggie

[![Build Status](https://travis-ci.org/micburks/veggie.svg?branch=master)](https://travis-ci.org/micburks/veggie)
[![Coverage Status](https://coveralls.io/repos/github/micburks/veggie/badge.svg?branch=master)](https://coveralls.io/github/micburks/veggie?branch=master)
[![NPM Version](https://img.shields.io/npm/v/veggie.svg)](https://www.npmjs.com/package/veggie)
[![License](https://img.shields.io/npm/l/rollup.svg)](https://github.com/micburks/veggie/blob/master/LICENSE)

> *Eat your damn vegetables*

Interactive mock server for profiling user scenarios

With veggie you can add mock data and route handlers to an existing server.
Veggie provides a API to alter requests while the server is running to allow
you to manage user scenarios.


### Motivation

Veggie was created to do 3 things:

- serve mock data in a dev server
- serve the same data in tests
- allow testing/demoing specific user scenarios

A user scenario (or profile) is defined here as a set of services and their
responses. This may include varying errors from different services due to bad
input data or downed servers, or it could refer to situations where a user is
not enrolled in a campaign or not registered for an application. Any situation
worth testing.


### Installation

```bash
npm i -D veggie
```


## Service configuration

### Create routes

Veggie builds an express router by looking at service files. A service file is
a file that exports an object that keys your service url to either:

- a static JSON object
- a path to a json file
- an express route that completes the request


```javascript
const path = require('path')

module.exports = {

  // JSON object
  '/service/user': {
    d: {
      id: 1
    }
  },

  // Hot-loaded json file
  '/service/posts': path.join(__dirname, '../data/posts.json'),

  // Express route
  '/service/post/save': function (req, res) {
    res.send({ message: 'Post saved!' })
  }
}
```


#### Hot-loaded JSON files: 

If you are using a path to a JSON file, the file will be loaded every time this
url is reached. This allows you to edit your JSON file and have it sent without
restarting your development server.


## Options

#### dir

**Required**

Glob matching the service configuration files

e.g. `'services/**/*.js'`


#### time

Max delay in milliseconds before returning mock data

Default `1000`


#### log

Enable logging

Default `true`


#### profileDir

Directory with which to save/load profiles

Default `process.cwd() // Directory where server was started`


#### profile

Initial profile to load

e.g. `userNotRegistered`


#### repl

Enable REPL server (use `veg-connect` to connect)

Default: `true`


## Serve your veggie routes

### Serve mock data from webpack-dev-server

```javascript
// webpack.config.js
const veggie = require('veggie')
// ...
  devServer: {
    setup(app) {
      app.use(veggie.router(options))
    }
  }
// ...
```


### Serve mock data from a stand alone server

#### Run the server

```bash
veg -d services/**/*.js -p 1337 -t 1000
```

to serve from port 1337 with a max delay of 1 second


#### Add proxies to webpack-dev-server

In this case, you could then proxy from your dev server to the mock data
server. For example, in webpack-dev-server:

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


### Serve mock data in tests from karma

The mock middleware can be used in karma via the following

```javascript
// karma.conf.js
const mockMiddleware = require('veggie').middleware
// ...
  middleware: ['veggie'],
  plugins: [
    'karma-*',
    {
      'middleware:veggie': [ 'factory', function () {
        return mockMiddleware(options)
    }]
    }
  ]
// ...
```

*Note about implementation: For the sake of uniformity, this middleware will
actually spawn an express server, as the binary would, and proxies all requests
to that. This is so we can use Express routes and all the useful methods that
come along with them.*


## Managing profiles

Veggie provides a helpful set of methods to alter the data served from the
running server. This API is the core of creating and changing profiles. These
methods create overrides to the services we defined in the service
configuration. The override configuration (i.e. the profile) can be saved and
subsequently loaded back into the server.


### API methods

*Note: All methods use fetch and return a promise. A promise polyfill may be
required depending on your environment.*


#### block
```javascript
// Set the '/getUser' response to be an empty object with a 404 status code
veggie.block('/getUser')
```

#### blockAll
```javascript
// TODO: Not implemented - possibly not even wanted
// Block all services as above
veggie.blockAll()
```

#### set
```javascript
// Set the '/getUser' status code and response 
veggie.set('/getUser', 400, { message: 'Bad request for /getUser' })
```

#### hang
```javascript
// Set the '/getUser' route handler to never respond
 veggie.hang('/getUser')
```

#### reset
```javascript
// Reset the '/getUser' response to the default specified in the service configuration
veggie.reset('/getUser')
```

#### resetAll
```javascript
// Reset all current overrides or remove current profile
veggie.resetAll()
```

#### show
```javascript
// Show the currently overriden services
veggie.show()
```

#### showAll
```javascript
// Show the current override configuration
veggie.showAll()
```

#### save
```javascript
// Save the current override configuration as a profile using the given name
// Saved to '<profileDir>/adminUser.json'
veggie.save('adminUser')
```

#### load
```javascript
// Load the profile matching the given name
// Loaded from '<profileDir>/adminUser.json'
veggie.load('adminUser')
```

*Note: profileDir (for save and load) defaults to `process.cwd()` (the directory the server was
launched from). It can alternatively be set using the `profileDir` options*


### Call API from browser

By placing a script tag in your demo index.html, you can call the API methods
from the browser console.

```html
<script src="/node_modules/veggie/dist/veggie.api.js"></script>
```

The veggie API will be available namespaced to `window.veggie`

*Note: promise and fetch polyfills may be required depending on your browser*


### Call API from REPL

Services can also be manipulated through a REPL (read-eval-print-loop) by
installing `veg-connect`

```bash
$ npm  i -g veg-connect
$ veg-connect
veg-connect: connected to repl at /tmp/veggie.sock
```

The veggie API will be available as global functions.


### Call API from tests

#### Testing in the browser

```javascript
// This should point to veggie's package.json `browser` field (`veggie.api.js`)
import * as veggie from 'veggie'

// If you plan to test in a fetch-less browser
require('isomorphic-fetch')
// or just
require('whatwg-fetch')

// ...
  before(() => {
    return veggie.block('/my/blocked/route')
  })
// ...
```


#### Testing in Node

```javascript
// This should point to veggie's package.json `main` or `module` field (`veggie.js` or `veggie.es.js`)
const veggieApi = require('veggie').api
// or
// import { api as veggieApi } from 'veggie'

// In node, you need to specify the port and host before using the api
// port defaults to 1337
// host defaults to 'http://localhost'
// veggieApi returns the api pointed to the specified host and port 
const veggie = veggieApi(9999, 'http://localhost')

// Fetch is required
require('isomorphic-fetch')
// or just
require('node-fetch')

// ...
  before(() => {
    return veggie.block('/my/blocked/route')
  })
// ...
```
