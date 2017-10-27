import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'
import getPort from 'get-port'
import glob from 'glob'
import http from 'http'
import path from 'path'
import replServer from './repl'
import url from 'url'
import { profileError, profileLog, setLog } from './log'
import { apiMiddleware, apiMethods, apiServices } from './api'
import { profileOverrideMiddleware } from './profile'
import { randomExclusive } from './common'
import fetchApi from './fetchClientApi'
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
function proxyMiddleware ({ profile = null, log = true }) {
  setLog(log)
  const config = arguments[0]
  config.catchAllStatusCode = proxyPassThroughCode

  // Load intial profile
  if (profile) {
    apiMethods.loadProfile(profile)
  }

  // Start server
  let proxyPort
  getPort().then(port => {
    proxyPort = port
    server(config).listen(port, () => {
      profileLog(`serving mock data from localhost:${port}`)
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
        profileError(`error reading proxy ${e}`)
      })

      // Receive data
      let data = ''
      proxyRes.on('data', chunk => { data += chunk })

      // Finish proxied request
      proxyRes.on('end', () => {
        try {
          res.writeHead(proxyRes.statusCode, proxyRes.headers)
          res.write(data)
          res.end()
        } catch (e) {
          profileError(`error parsing json from ${req.path}`)
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
  const app = express()
  app.use(router(config))
  return app
}

/**
 * Router containing all mock data routes and using profile middleware
 * Profiles are loaded at initialization and can be manipulated via REPL
 *
 * @param {object} - configuration object
 * @returns {Express router}
 */
function router ({ dir, catchAllStatusCode = null, time = MAX_DELAY, profile = null, repl = true, log = true }) {
  if (!dir) {
    throw new Error('veggie: dir is required')
  }

  setLog(log)
  const router = express.Router()

  // Apply middleware
  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(apiMiddleware())
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
    throw new Error('veggie: error reading `dir` glob')
  }

  // Build master route config object
  const routeConfig = files
    .reduce((acc, file) => {
      let services
      try {
        if (!path.isAbsolute(file)) {
          // Make file path absolute
          file = path.join(process.cwd(), file)
        }
        services = require(file)
        acc = Object.assign(acc, services)
      } catch (e) {
        profileError(`error reading file ${file}`)
      }
      return acc
    }, {})

  const services = {}
  const urls = Object.keys(routeConfig)
  for (let url of urls) {
    const handler = helpers.getRouteHandler(routeConfig[url])
    services[url] = handler
    yield { url, handler }
  }

  apiServices.setServices(services)
}

export { proxyMiddleware as middleware, router, server, fetchApi as api, helpers }
