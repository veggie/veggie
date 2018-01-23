import 'babel-polyfill'
import url from 'url'
import http from 'http'
import express from 'express'
import getPort from 'get-port'
import store from './state/store'
import bodyParser from 'body-parser'
import * as fetchApi from './client'
import { apiPath, apiRouter } from './server'
import { routerSel } from './state/selectors'
import { profileError, profileLog } from './log'
import {
  breakRouterCache,
  getAvailableProfiles,
  setCurrentProfileName,
  setServices,
  setSettings
} from './state/reducers'

/**
 * Middleware that intercepts requests matching service routes or api paths
 * Profiles are loaded at initialization and can be manipulated via api calls
 *
 * @param {object} config
 * @returns {Express middleware}
 */
function proxyMiddleware (config) {
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
 * Profiles are loaded at initialization
 *
 * @param {object} - configuration object
 * @returns {Express router}
 */
function router ({
  dir,
  log = true,
  profile = null,
  profileDir = null,
  time = null
}) {
  if (!dir) {
    throw new Error('veggie: dir is required')
  }

  // Initialize stored state
  store.init()

  // Initialize state
  store.dispatch(
    setSettings({ log, profileDir, time }),
    setServices(dir),
    getAvailableProfiles(),
    setCurrentProfileName(profile),
    breakRouterCache()
  )

  const router = express.Router()

  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(apiPath, apiRouter)
  router.use((req, res, next) => {
    const serviceRouter = routerSel()
    serviceRouter(req, res, next)
  })

  return router
}

export { proxyMiddleware as middleware, router, server, fetchApi as api }
