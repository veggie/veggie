import path from 'path'
import glob from 'glob'
import uuid from 'uuid'
import store from './state/store'
import { getQueryFromUrl } from './utils'
import { profileError, serverError } from './log'
import { delaySel, serviceByIdSel } from './state/selectors'

const alphabetize = (a, b) => a.localeCompare(b)

/**
 * Return random number from 0 to max, exclusive
 * @param {number} max
 * @returns {number}
 */
export const randomExclusive = max => Math.floor(Math.random() * max)

/**
 * Returns an express route handler for the given user-defined response
 *
 * @param {function|object|string} response - The service response
 * @param [optional] {number} statusCode - status code to be used for response
 * @returns {(req: Express Request, res: Express Response) => void}
 */
export function getRouteHandler (id) {
  const { statusCode, response, type } = serviceByIdSel(id)

  if (type === 'function') {
    // Express route - will need to handle status code itself
    return response
  } else if (type === 'string') {
    // Path to json file
    return (req, res) => {
      let data
      try {
        data = cachelessRequire(response)
      } catch (e) {
        serverError(e)
      }
      if (data) {
        res.status(statusCode || 200).json(data)
      }
      else {
        res.status(statusCode || 404).json({})
      }
    }
  } else {
    // JSON object
    return (req, res) => {
      if (response) {
        res.status(statusCode || 200).json(response)
      }
      else {
        res.status(statusCode || 404).json({})
      }
    }
  }
}

/**
 * Turn query string into query object
 *
 * @param {string} url
 * @returns {object} query
 */
export function getQueryFromUrl (url) {
  let [ baseUrl, query ] = url.split('?')
  query = query || null
  let queryString = null

  if (query && query !== '') {
    query = query.split('&')
      .reduce((acc, pair) => {
        const [ key, value ] = pair.split('=')
        acc[decodeURIComponent(key)] = decodeURIComponent(value)
        return acc
      }, {})

    // Create key from alphabetized query string
    queryString = Object.keys(query)
      .sort(alphabetize)
      .map(key => `${key}=${query[key]}`)
      .join('&')
  }

  return { baseUrl, query, queryString }
}

export function getQueryHandler (ids) {
  const { byId } = store.getState().services

  // Sort ids so that we match most query parameters first
  ids = ids.sort((idA, idB) => {
    const urlA = byId[idA].url
    const urlB = byId[idB].url
    let numParamsA = 0
    let numParamsB = 0

    if (urlA.query) {
      numParamsA = Object.keys(urlA.query).length
    }

    if (urlB.query) {
      numParamsB = Object.keys(urlB.query).length
    }

    return numParamsA - numParamsB
  })

  return (req, res) => {
    const match = ids.find(id => {
      const { url } = byId[id]

      if (url.query === null) {
        // This is the fallback handler
        return true
      } else {
        return Object.keys(url.query)
          .every(key => req.params[key] === url.query[key])
      }
    })

    if (match) {
      const callback = getRouteHandler(match)
      setTimeout(() => {
        callback(req, res)
      }, randomExclusive(delaySel()))
    } else {
      res.sendStatus(404, { status: 'failed', error: 'callback not found' })
    }
  }
}

/**
 * @param {string} filePath - absolute file path to load
 * @returns {module} - required file
 */
function cachelessRequire (filePath) {
  const data = require(filePath)
  delete require.cache[filePath]
  return data
}

/**
 * @param {string} url
 * @param {object} config
 * @returns {object} service
 */
export function formatService (url, config) {
  return {
    id: uuid.v4(),
    url: getQueryFromUrl(url),
    statusCode: config.status || 200,
    method: (config.method || 'all').toLowerCase(),
    response: config.method ? config.response : config,
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
