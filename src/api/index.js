import express from 'express'
import pathToRegexp from 'path-to-regexp'
import * as apiMethods from './methods'
import { apiPathPrefix } from '../common'

const middlewareApiRegex = pathToRegexp(`${apiPathPrefix}/:method/:arg?`)

export apiMethods

/**
 * Middleware that registers the profile api
 * @returns {function}
 */
export function apiMiddleware () {
  const apiRouter = express.Router()
  Object.keys(apiMethods)
    .forEach(method => {
      apiRouter.all(`${apiPathPrefix}/${method}/:arg?`, apiRoutes[`${method}Route`])
    })
  return (req, res, next) {
    if (middlewareApiRegex.test(req.path)) {
      apiRouter(req, res, next)
    } else {
      next()
    }
  }
}

const apiRoutes = {
  // TODO
}
