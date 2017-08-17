import bodyParser from 'body-parser'
import express from 'express'
import glob from 'glob'
import replServer from './repl'
import url from 'url'
import { getBlockedHandler, profileMiddleware, profileServer, setAvailableServices } from './profile'
import * as helpers from './utils'

const MAX_DELAY = 1000

const middlewareApiPath = /\/api\/profile\/(.*)(\/.*)?/
const profileMethods = {}

/**
 * Middleware for intercepting service request
 * @param {object} config
 * @returns {Express middleware}
 */
function interceptMiddleware ({ dir, time = MAX_DELAY, profile = null, transform = null }) {
  // Get routes
  const routes = {}
  for (let { url, handler } of routesFromDir(dir)) {
    // not using a delay
    routes[url] = handler
  }

  const dummyResponse = (res) => ({
    send (response) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify(response))
      res.end()
    },
    json (response) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify(response))
      res.end()
    },
    status (code) {
      res.statusCode = code
      return dummyResponse(res)
    }
  })

  return function(req, res, next) {
    // Give req some express-like properties
    req = normalize(req)

    // check for profile method request
    const match = middlewareApiPath.exec(req.url)
    if (match) {
      const method = match[1]
      console.log(`middleware: got profile method ${method}`)
      if (profileServer[method]) {
        // perform profile method
        console.log('middleware: found profile method')
        if (match[2]) {
          profileServer[method](arg)
        } else {
          profileServer[method]()
        }
        return res.end()
      }
    }

    const blockedHandler = getBlockedHandler(req.url)
    if (blockedHandler) {
      return blockedHandler(req, dummyResponse(res))
    }

    // path transform
    // i.e. `User(userCtx='dynamicContent')` => `User*`
    let { url } = req
    if (transform) {
      url = transform(url)
    }

    if (routes[url]) {
      routes[url](req, dummyResponse(res))
    } else {
      next()
    }
  }
}

/**
 * Add express-like accessors to http request object
 * @param {Request} req
 * @returns {Request}
 */
function normalize (req) {
  const parsed = url.parse(req.url)
  req.path = parsed.pathname
  const searchParams = new url.URLSearchParams(parsed.search)
  if (searchParams) {
    req.query = {}
    for (let [key, value] of searchParams.entries()) {
      req.query[key] = value
    }
  }
  return req
}

/**
 * Entry point for server
 * @param {object} config
 * @returns {Express app}
 */
function server (config) {
  config.app = express()
  config.app.use(router(config))
  return config.app
}

/**
 * Router containing all mock data routes
 * @param {object} - configuration object
 * @returns {Express router}
 */
function router ({ dir, time = MAX_DELAY, profile = null }) {
  const router = express.Router()

  // Apply middleware
  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(profileMiddleware(profile))

  // Apply all routes
  for (let { url, handler } of routesFromDir(dir)) {
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
 * Return random delay from 0 to time, exclusive
 * @param {number} time - max delay
 * @returns {number}
 */
function randomDelay (time) {
  return Math.floor(Math.random() * time)
}

/**
 * Reads files matching supplied glob and yields url and handler of routes found
 * @param {glob} dir
 * @returns void
 */
function *routesFromDir (dir) {
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

  const services = {}
  const urls = Object.keys(routeConfig)
  for (let url of urls) {
    const handler = helpers.getRouteHandler(routeConfig[url])
    services[url] = handler
    yield { url, handler }
  }

  setAvailableServices(services)
}

export { interceptMiddleware as middleware, router, server, helpers }
