const bodyParser = require('body-parser')
const express = require('express')
const fs = require('fs')
const glob = require('glob')
const net = require('net')
const path = require('path')
const repl = require('repl')
const replUtils = require('./replUtils')
const profileMiddleware = replUtils.profileMiddleware
const util = require('util')

const MAX_DELAY = 1000

/**
 * @returns void
 */
function startReplServer () {
  // Open net connection for repl
  const replServer = net.createServer(socket => {
    console.log('Mocket session: Connected')
    const session = repl.start({
      prompt: 'mock-client > ',
      input: socket,
      output: socket,
      terminal: true
    })
    session.defineCommand('save', {
      help: 'Save session to file',
      action (name) {
        const history = this.history.reverse().filter(line => !(/^\./).test(line))
        const requires = `const { ${Object.keys(replUtils.methods).join(', ')} } ` +
          `= require('service-profile/services/replUtils').methods`
        const file = `${process.cwd()}/${name}`
        fs.writeFileSync(file, [ requires, ...history ].join('\n'))
        console.log(`Saved to ${file}`)
        this.displayPrompt()
      }
    })
    session.defineCommand('load', {
      help: 'Load session from file',
      action (fileName) {
        const file = fs.readFileSync(fileName).toString()
        const code = file.replace('service-profile/services', '.')
        console.log('Running loaded code:\n', code, '\n--End of code--\n')
        eval(code)
      }
    })
    session.on('exit', () => {
      console.log('Mocket session: Exit')
      // socket.destroy()
      socket.end()
    })
    session.context = Object.assign(session.context, replUtils.methods)
  })
  replServer.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Repl server: Address in use')
      replServer.close()
    }
  })
  replServer.on('close', () => {
    console.log('Repl server: Closing')
  })
  replServer.listen(replUtils.addr)
}

/**
 * Entry point for server
 *
 * @param {object} config
 * @returns {Express app}
 */
function server (config) {
  config.app = express()
  mockData(config)
  return config.app
}

/**
 * @param {object} - configuration object
 * @returns void
 */
function mockData ({ app, dir, time = MAX_DELAY, profile = null }) {
  // Apply middleware
  app.use(bodyParser.json())
  app.use(profileMiddleware(profile))

  // Find files matching glob
  let files
  try {
    files = glob.sync(dir)
  } catch (e) {
    throw new Error('service-profile: error reading `dir` glob')
  }

  // Build master route config object
  const routeConfig = files
    .reduce((acc, file) => {
      const services = require(file)
      acc = Object.assign(acc, services)
      return acc
    }, {})

  // Apply all routes
  mockRoutes(app, routeConfig, time)

  // Start interactive server
  startReplServer()
}

/**
 * @param {Express app} app
 * @param {object} routes - route config object
 * @param {number} time - max delay before completing response
 * @returns void
 */
function mockRoutes (app, routes, time) {
  Object.keys(routes).forEach(url => {
    const delay = Math.floor(Math.random() * time)
    const handler = getRouteHandler(routes[url])

    // Add the route to the app
    app.all(url, (...args) => {
      setTimeout(() => {
        handler(...args)
      }, delay)
    })
  })
}

/**
 * Returns an express route handler for the given service
 *
 * @param {function|object|string} response - The service response
 * @returns {(req: Express Request, res: Express Response) => void}
 * @private
 */
function getRouteHandler (response) {
  if (typeof response === 'function') {
    // Express route
    return response
  }

  if (typeof response === 'string') {
    // Path to json file
    return (req, res) => {
      const data = cachelessRequire(response)
      if (data) {
        res.json(data)
      }
      else {
        res.status(404).json({})
      }
    }
  }

  // Json object
  const data = response
  return (req, res) => {
    if (data) {
      res.json(data)
    }
    else {
      res.status(404).json({})
    }
  }
}

/**
 * @param {string} filePath - absolute file path to load
 * @returns {module} - required file
 */
function cachelessRequire (filePath) {
  const data = require(filePath)
  delete require.cache[filePath]
  return data
}

module.exports = { server, mockData }
