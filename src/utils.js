import path from 'path'
import glob from 'glob'
import uuid from 'uuid'
import store from './state/store'
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
 * @param [optional] {number} status - status code to be used for response
 * @returns {(req: Express Request, res: Express Response) => void}
 */
export function getRouteHandler (id) {
  const service = serviceByIdSel(id)
  const { hang, response, status, type } = service.override || service

  if (hang) {
    return () => {}
  } else if (type === 'function') {
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
        res.status(status || 200).json(data)
      } else {
        res.status(status || 404).json({})
      }
    }
  } else {
    // JSON object
    return (req, res) => {
      if (response) {
        res.status(status || 200).json(response)
      } else {
        res.status(status || 404).json({})
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
export function getQueryFromUrl (full) {
  let [ baseUrl, query ] = full.split('?')
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

  return { baseUrl, query, queryString, full }
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

    return numParamsB - numParamsA
  })

  return (req, res) => {
    const match = ids.find((id, index) => {
      const { url } = byId[id]

      if (url.query === null) {
        // This is the fallback handler
        return true
      } else {
        return Object.keys(url.query)
          .every(key => req.query[key] === url.query[key])
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
    status: config.status || 200,
    method: (config.method || 'all').toLowerCase(),
    response: config.response ? config.response : config,
    type: typeof config
  }
}

/**
 * Reads files matching supplied glob and yields url and handler of routes found
 * @param {glob} dir
 * @returns void
 */
export function * servicesFromDir (dir) {
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
