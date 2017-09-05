import express from 'express'
import pathToRegexp from 'path-to-regexp'
import * as apiMethods from './methods'
import * as apiServices from './services'
import { apiPathPrefix } from '../common'

const middlewareApiRegex = pathToRegexp(`${apiPathPrefix}/:method/:arg?`)

export { apiMethods, apiServices }

/**
 * Middleware that registers the profile api
 * @returns {function}
 */
export function apiMiddleware () {
  const apiRouter = express.Router()
  Object.keys(apiMethods)
    .forEach(method => {
      apiRouter.all(`${apiPathPrefix}/${method}/:arg?`, apiHandler)
    })
  return (req, res, next) => {
    // TODO: is this test necessary? profile isn't doing one
    if (middlewareApiRegex.test(req.path)) {
      apiRouter(req, res, next)
    } else {
      next()
    }
  }
}

/**
 * Route handler for api calls
 * @returns {void}
 */
function apiHandler (req, res) {
  const { body, params } = req
  const { method, arg } = params

  try {
    if (body) {
      apiMethods[method](body)
    } else {
      apiMethods[method](arg)
    }
    res.status(200)
    res.send({ message: `mock-server: ${method} call successful` })
  } catch (e) {
    res.status(500)
    res.send({ message: `mock-server: ${method} call failed` })
  }
  res.end()
}
