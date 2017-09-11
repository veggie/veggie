import express from 'express'
import * as apiMethods from './methods'
import * as apiServices from './services'
import { apiPathPrefix } from '../common'

const middlewareApiRegex = `${apiPathPrefix}/:method/:arg?`

export { apiMethods, apiServices }

/**
 * Middleware that registers the profile api
 * @returns {function}
 */
export function apiMiddleware () {
  const apiRouter = express.Router()
  Object.keys(apiMethods)
    .forEach(method => {
      apiRouter.all(middlewareApiRegex, apiHandler)
    })
  return (req, res, next) => {
    apiRouter(req, res, next)
  }
}

/**
 * Route handler for api calls
 * @returns {void}
 */
function apiHandler (req, res) {
  const { params } = req
  const { method, arg } = params

  // TODO: use body from POST as well

  try {
    let payload
    payload = apiMethods[method](arg)
    res.status(200)
    res.send({ message: `mock-server: ${method} call successful`, payload })
  } catch (e) {
    res.status(500)
    res.send({ message: `mock-server: ${method} call failed` })
  }
  res.end()
}
