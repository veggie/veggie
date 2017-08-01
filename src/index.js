const bodyParser = require('body-parser')
const express = require('express')
const glob = require('glob')
const path = require('path')
const replServer = require('./repl')
const replUtils = require('./replUtils')

const profileMiddleware = replUtils.profileMiddleware
const MAX_DELAY = 1000

/**
 * Entry point for server
 *
 * @param {object} config
 * @returns {Express app}
 */
function server (config) {
  config.app = express()
  app.use(router(config))
  return config.app
}

/**
 * @param {object} - configuration object
 * @returns {Express router}
 */
function router ({ dir, time = MAX_DELAY, profile = null }) {
  const router = express.Router()

  // Apply middleware
  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(profileMiddleware(profile))

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
  for (let { url, handler } in routes(routeConfig)) {
    router.all(url, (...args) => {
      setTimeout(() => {
        handler(...args)
      }, randomDelay(time))
    })
  }

  // Start interactive server
  replServer()

  return router
}

/**
 * @param {number} time - max delay
 * @returns {number}
 */
function randomDelay (time) {
  return Math.floor(Math.random() * time)
}

/**
 * @param {Express app} app
 * @param {object} routes - route config object
 * @param {number} time - max delay before completing response
 * @returns void
 */
function *routes (app, routes, time) {
  Object.keys(routes).forEach(url => {
    const handler = getRouteHandler(routes[url])
    yield { url, handler }
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

module.exports = { server, router }
