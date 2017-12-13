import crypto from 'crypto'
import express from 'express'
import path from 'path'
import { filter } from './utils'
import { apiMethods } from './api'
import { getRouteHandler } from './utils'

let profileRouter
let cachedProfileHash
let serviceOverrides = {}

export function setOverride (url, override) {
  serviceOverrides[url] = override
}

export function setAllOverrides (overrides = {}) {
  serviceOverrides = overrides
}

export function resetOverride (url) {
  delete serviceOverrides[url]
}

export function resetAllOverrides () {
  serviceOverrides = {}
}

/**
 * Find all matching service overrides
 *
 * @param {regex|string} serviceName - match to compare with service url
 * @returns {array} - array of matching services
 */
export function filterOverrides (serviceName) {
  return filter(serviceOverrides, serviceName)
}


/**
 * Middleware that registers profile override responses
 *
 * @param {string} profile - name of profile to initially load
 * @param {string} profileDir - directory to save/load profiles
 * @returns {function}
 */
export function profileOverrideMiddleware (profile = null, profileDir = null) {
  // Set directory for saving/loading profiles
  if (profileDir) {
    // Make profile dir absolute
    if (!path.isAbsolute(profileDir)) {
      profileDir = path.join(process.cwd(), profileDir)
    }
    apiMethods._setProfileDir(profileDir)
  }

  // Load intial profile
  if (profile) {
    apiMethods.load(profile)
  }

  return (req, res, next) => {
    profileRouter = getRouter()
    profileRouter(req, res, next)
  }
}

/**
 * Get router representing the currently loaded profile
 * @returns {Express router}
 */
function getRouter () {
  const profileHash = getProfileHash()
  if (profileHash === cachedProfileHash) {
    return profileRouter
  }

  // cache profile hash
  cachedProfileHash = profileHash

  // create new router
  const router = express.Router()
  Object.keys(serviceOverrides)
    .forEach(url => {
      router.all(url, getOverrideHandler(url, serviceOverrides[url]))
    })
  return router
}

/**
 * Get a hash of the currently loaded profile
 * @returns {string} - hash of current service overrides object
 */
function getProfileHash () {
  const hash = crypto.createHash('md5')
  hash.update(JSON.stringify(serviceOverrides))
  return hash.digest('hex')
}

/**
 * Parse profile override and get route handler function
 * @param {object} override - profile override to parse
 * @returns {Express route} - route handler
 */
function getOverrideHandler (url, { response, status, hang }) {
  if (hang) {
    return (req, res) => {}
  } else {
    return getRouteHandler(url, response, status)
  }
}
