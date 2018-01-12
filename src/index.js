import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'
import getPort from 'get-port'
import http from 'http'
import replServer from './repl'
import url from 'url'
import { profileError, profileLog, setLog } from './log'
import { apiMiddleware } from './api'
import { profileMiddleware } from './profile'
import { routesFromDir } from './service'
import { randomExclusive } from './utils'
import fetchApi from './fetchClientApi'

const MAX_DELAY = 1000

/**
 * Middleware that intercepts requests matching service routes or api paths
 * Profiles are loaded at initialization and can be manipulated via api calls
 *
 * @param {object} config
 * @returns {Express middleware}
 */
function proxyMiddleware ({ log = true }) {
  const config = arguments[0]

  // Set log capabilities
  setLog(log)

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
function router ({ dir, time = MAX_DELAY, profile = null, profileDir = null, repl = true, log = true }) {
  if (!dir) {
    throw new Error('veggie: dir is required')
  }

  setLog(log)
  const router = express.Router()

  // Apply middleware
  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(apiMiddleware())
  router.use(profileMiddleware(profile, profileDir))

  // Apply all routes
  for (let { url, method, handler } of routesFromDir(dir)) {
    method = method || 'all'
    router[method](url, (...args) => {
      setTimeout(() => {
        handler(...args)
      }, randomExclusive(time))
    })
  }

  if (repl) {
    // Start interactive server
    replServer()
  }

  return router
}

export { proxyMiddleware as middleware, router, server, fetchApi as api }
