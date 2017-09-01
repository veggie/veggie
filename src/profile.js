import { getServices, profileRouter, matchServices } from './api'

/**
 * Middleware that registers profile override responses
 * @returns {function}
 */
export function profileOverrideMiddleware (profile) {
  return (req, res, next) => {
    // let profileRouter = getProfileRouter()
    profileRouter(req, res, next)
  }
}
