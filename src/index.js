import 'babel-polyfill'
import fs from 'fs'
import url from 'url'
import uuid from 'uuid'
import http from 'http'
import express from 'express'
import getPort from 'get-port'
import bodyParser from 'body-parser'
import store from './state/store'
import { profileError, profileLog, setLog } from './log'
import { formatService, servicesFromDir } from './service'
import { randomExclusive } from './utils'
import { apiPath, apiRouter } from './api'
import * as fetchApi from './fetchClientApi'

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
  time = MAX_DELAY
}) {
  if (!dir) {
    throw new Error('veggie: dir is required')
  }

  setLog(log)

  for (let { url, config } of servicesFromDir(dir)) {
    store.dispatch(state => {
      const service = formatService(url, config[url])
      const { id } = service
      state.services.ids.push(id)
      state.services.byId[id] = service

      return state
    })
  }

  store.dispatch(state => {
    profileDir = profileDir || process.cwd()
    state.profiles.dir = profileDir

    try {
      fs.readdirSync(profileDir)
        .forEach(name => {
          const id = uuid.v4()
          state.profiles.ids.push(id)
          state.profiles.byId[id] = { id, name }
          if (profile === name) {
            state.profiles.current = id
          }
        })
    } catch (e) {
      profileError(`error reading profileDir ${profileDir} ${e}`)
    }

    return state
  })

  const router = express.Router()

  router.use(bodyParser.json({ limit: '50mb' }))
  router.use(apiPath, apiRouter)
  // router.use(responseMiddleware())

  return router
}

export { proxyMiddleware as middleware, router, server, fetchApi as api }
