import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'
import getPort from 'get-port'
import glob from 'glob'
import http from 'http'
import replServer from './repl'
import url from 'url'
import { profileApiMiddleware, profileMethods, profileOverrideMiddleware, setAvailableServices } from './profile'
import { randomExclusive } from './common'
import * as helpers from './utils'

const MAX_DELAY = 1000
const proxyPassThroughCode = 501

/**
 * Middleware that intercepts requests matching service routes or api paths
 * Profiles are loaded at initialization and can be manipulated via api calls
 *
 * @param {object} config
 * @returns {Express middleware}
 */
function proxyMiddleware ({ dir, time = MAX_DELAY, profile = null }) {
  const config = arguments[0]
  config.catchAllStatusCode = proxyPassThroughCode

  // Load intial profile
  if (profile) {
    profileMethods.loadProfile(profile)
  }

  // Start server
  let proxyPort
  getPort().then(port => {
    proxyPort = port
    server(config).listen(port, () => {
      console.log(`service-profile: Serving mock data from localhost:${port}`)
    })
  })

  // Return proxy middleware function
  return (req, res, next) => {
    const options = url.parse(req.url)
    options.port = proxyPort
    options.method = req.method
    options.headers = req.headers

    // Create proxy request
    const proxyReq = http.request(options)

    // When proxy responds
    proxyReq.on('response', proxyRes => {
      if (proxyRes.statusCode === proxyPassThroughCode) {
        // Not Implemented
        return next()
      }

      // Error handler
      proxyRes.on('error', e => {
        console.log(`service-profile: error reading proxy ${e}`)
      })

      // Receive data
      let data = ''
      proxyRes.on('data', chunk => { data += chunk })

      // Finish proxied request
      proxyRes.on('end', () => {
        let json
        try {
          json = JSON.parse(data)
          res.writeHead(proxyRes.statusCode, proxyRes.headers)
          res.write(JSON.stringify(json))
          res.end()
        } catch (e) {
          console.error(`service-profile: error parsing json from ${req.path}`)
          next()
        }
      })
    })

    // Pipe incoming request to proxy request
    req.pipe(proxyReq)
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
function router ({ dir, catchAllStatusCode = null, time = MAX_DELAY, profile = null, repl = true }) {
  const router = express.Router()

  // Apply middleware
  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(profileApiMiddleware())
  router.use(profileOverrideMiddleware(profile))

  // Apply all routes
  for (let { url, handler } of routesFromDir(dir)) {
    router.all(url, (...args) => {
      setTimeout(() => {
        handler(...args)
      }, randomExclusive(time))
    })
  }

  if (repl) {
    // Start interactive server
    replServer()
  }

  if (catchAllStatusCode) {
    router.all('*', (req, res) => {
      res.sendStatus(catchAllStatusCode)
    })
  }

  return router
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

export { proxyMiddleware as middleware, router, server, helpers }
