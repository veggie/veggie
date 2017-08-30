import bodyParser from 'body-parser'
import express from 'express'
import getPort from 'get-port'
import glob from 'glob'
import http from 'http'
import pathToRegexp from 'path-to-regexp'
import replServer from './repl'
import url from 'url'
import { getApiHandler, getProfileOverrideHandler, profileMethods, profileMiddleware, setAvailableServices } from './profile'
import * as helpers from './utils'

const MAX_DELAY = 1000
const middlewareApiRegex = pathToRegexp('/service-profile/api/:method/:arg?')

/**
 * Middleware that intercepts requests matching service routes or api paths
 * Profiles are loaded at initialization and can be manipulated via api calls
 *
 * @param {object} config
 * @returns {Express middleware}
 */
function middleware ({ dir, time = MAX_DELAY, profile = null }) {
  const config = arguments[0]
  let proxyPort
  getPort().then(port => {
    proxyPort = port
    server(config).listen(port, () => {
      console.log(`service-profile: Serving mock data from localhost:${port}`)
    })
  })

  return (req, res, next) => {
    const parsedUrl = url.parse(req.url)
    console.log(`got request ${parsedUrl.hostname} ${parsedUrl.pathname} ${req.method}`)
    const proxyReq = http.request({
      hostname: parsedUrl.hostname,
      port: proxyPort,
      path: parsedUrl.pathname,
      method: req.method
    }, proxyRes => {
      console.log(proxyRes.statusCode, proxyRes.statusMessage, proxyRes.url)
      proxyRes.pipe(res)
    })
    req.pipe(proxyReq)
  }

    /*
  // Get routes
  const routes = []
  for (let { url, handler } of routesFromDir(dir)) {
    // not using a delay
    routes.push({
      handler,
      regex: pathToRegexp(url)
    })
  }

  function getRouteHandler (url) {
    const route = routes.find(route => route.regex.test(url))
    if (route) {
      return route.handler
    }
    return
  }

  // Load intial profile
  profileMethods.loadProfile(profile)

  return function(req, res, next) {
    // TODO: remove these by requiring karma to use karma-express-server
    // Give req some express-like properties
    req = dummyRequest(req)
    res = dummyResponse(res)

    const { url } = req

    // API request
    const apiHandler = getApiHandler(url)
    if (apiHandler) {
      return apiHandler(req, res)
    }

    // Profile override response
    const profileOverrideHandler = getProfileOverrideHandler(url)
    if (profileOverrideHandler) {
      return profileOverrideHandler(req, res)
    }

    // Mock data response
    const routeHandler = getRouteHandler(url)
    if (routeHandler) {
      return routeHandler(req, res)
    }

    // Default
    next()
  }
  */
}

/**
 * Add express-like accessors to http request object
 * @param {Request} req
 * @returns {Request}
 */
function dummyRequest (req) {
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
 * Extend HTTP Response to have Express-like functions
 * @param {Response} res
 * @returns {Object} - response api
 */
function dummyResponse (res) {
  return {
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
  }
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
 * Router containing all mock data routes and using profile middleware
 * Profiles are loaded at initialization and can be manipulated via REPL
 *
 * @param {object} - configuration object
 * @returns {Express router}
 */
function router ({ dir, time = MAX_DELAY, profile = null, repl = true }) {
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

  if (repl) {
    // Start interactive server
    replServer()
  }

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

export { middleware, router, server, helpers }
