import path from 'path'
import glob from 'glob'
import { profileError } from './log'
import { getRouteHandler } from './utils'
import { filter } from './utils'

let services = {}

/**
 * Find all matching services
 *
 * @param {regex|string} serviceName - match to compare with service url
 * @returns {array} - array of matching services
 */
export function filterServices (serviceName) {
  return filter(services, serviceName)
}

export function setServices (serviceMap = {}) {
  services = serviceMap
}

/**
 * Reads files matching supplied glob and yields url and handler of routes found
 * @param {glob} dir
 * @returns void
 */
export function *routesFromDir (dir) {
  // Find files matching glob
  let files
  try {
    files = glob.sync(dir)
  } catch (e) {
    throw new Error('veggie: error reading `dir` glob')
  }

  // Build master route config object
  const routeConfig = files
    .reduce((acc, file) => {
      let services

      try {
        if (!path.isAbsolute(file)) {
          // Make file path absolute
          file = path.join(process.cwd(), file)
        }
        services = require(file)
        acc = Object.assign(acc, services)
      } catch (e) {
        profileError(`error reading file ${file}`)
      }

      return acc
    }, {})

  const services = {}
  const urls = Object.keys(routeConfig)
  for (let url of urls) {
    const handler = getRouteHandler(url, routeConfig[url])
    services[url] = handler

    // Need to store the response function for later so we can call it
    // depending on the query param comparison

    // TODO: remove hard-coded method
    yield { url, method: 'all', handler }
  }

  // Or down here

    /*
  setQueryResponse(url, responseFn)
  return queryResponseHandler
  */

  // And this function call to cache the response needs to happen in the
  // profile module as well

  setServices(services)
}

