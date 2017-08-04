
# service-profile

Interactive mock server for profiling user scenarios


### Installation

```
npm i -D service-profile
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
const serviceProfile = require('service-profile')
// ...
  devServer: {
    setup(app) {
      app.use(serviceProfile.router({ dir: 'services/**/*.js' }))
    }
  }
// ...
```


## Run stand alone server

### Run the server

A binary is installed to `node_modules/.bin/mock-server`

```bash
mock-server -d services/**/*.js -p 1337 -t 1000
```

to serve from port 9999


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
restarting the dev server.

TODO


## Save profiles

TODO


## Use in tests

```javascript
// karma.conf.js
const mockMiddleware = require('service-profile').middleware
// ...
  middleware: [ 'serviceProfile' ],
  plugins: [
    'karma-*',
    { 'middleware:serviceProfile': [ 'factory', mockMiddleware ] }
  ]
// ...
```


## Changing profiles intests

If you want to change profiles during tests, you will need to include
TODO
