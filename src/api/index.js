import express from 'express'
import * as apiMethods from './methods'
import * as apiServices from './services'
import { apiPathPrefix } from '../common'

export { apiMethods, apiServices }

const middlewareApiRegex = `${apiPathPrefix}/:method/:name?/:config?`

/**
 * Middleware that registers the profile api
 * @returns {function}
 */
export function apiMiddleware () {
  const apiRouter = express.Router()
  apiRouter.all(middlewareApiRegex, apiHandler)
  return apiRouter
}

/**
 * Route handler for api calls
 * @returns {void}
 */
function apiHandler (req, res) {
  const { params, body } = req
  const { method } = params
  const name = decodeURIComponent(params.name)
  let args = []

  if (req.method.toLowerCase() === 'post') {
    args = req.body
  }

  if (!(method in apiMethods)) {
    res.status(501)
    res.send({ message: `mock-server: ${method} not implemented` })
  } else {
    try {
      let message = apiMethods[method](name, ...args)
      res.status(200)
      res.send({ status: 'success', message })
    } catch (e) {
      res.status(500)
      res.send({ status: 'fail', error: e.message })
    }
  }
  res.end()
}
