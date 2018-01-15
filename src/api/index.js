import express from 'express'
import { apiPathPrefix, apiVersion } from '../common'
import { router } from './router'

export { router as apiRouter }
// export const apiRouter = express.Router()
export const apiPath = `${apiPathPrefix}/${apiVersion}`

/**
 * Route handler for api calls
 * @returns {void}
 */
  /*
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
*/
