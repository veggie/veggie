import path from 'path'
import glob from 'glob'
import uuid from 'uuid'
import { profileError } from './log'
import { getQueryFromUrl } from './utils'

export function formatService (url, config) {
  return {
    id: uuid.v4(),
    url: getQueryFromUrl(url),
    response: config,
    type: typeof config
  }
}

/**
 * Reads files matching supplied glob and yields url and handler of routes found
 * @param {glob} dir
 * @returns void
 */
export function *servicesFromDir (dir) {
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

  for (let url in routeConfig) {
    yield { url, config: routeConfig[url] }
  }
}
