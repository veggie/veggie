import { apiMethods } from './api'
let profileRouter

// TODO: swap out router with new router everytime api is called

/**
 * Middleware that registers profile override responses
 * @returns {function}
 */
export function profileOverrideMiddleware (profile) {
  return (req, res, next) => {
    const { path } = req
    // this should be a regex
    let override = apiMethods.showAll()[path]
    if (override) {
      // pass to  current router
      const { status, response } = override
      return res.status(status).json(response)
    }
    next()
  }
}
