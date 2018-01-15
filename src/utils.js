import store from './state/store'
import { serverError } from './log'
import { delaySel, serviceByIdSel } from './state/selectors'

/**
 * Returns an express route handler for the given user-defined response
 *
 * @param {function|object|string} response - The service response
 * @param [optional] {number} statusCode - status code to be used for response
 * @returns {(req: Express Request, res: Express Response) => void}
 */
export function getRouteHandler (url, response, statusCode = null) {
  // Profile is set in memory
  // Router is created when profile route is hit
  // getOverrideHandler calls getRouteHandler
  //
  // Service router converts glob to files
  // Assigns all file exports to single object
  // Calls getRouteHandler for each key-value
  if (typeof response === 'function') {
    // Express route - will need to handle status code itself
    return response
  } else if (typeof response === 'string') {
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

export const alphabetize = (a, b) => a.localeCompare(b)

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
    console.log('query handler', req.url, req.body)
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
      console.log("nothing found")
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
 * Return random number from 0 to max, exclusive
 * @param {number} max
 * @returns {number}
 */
export const randomExclusive = max => Math.floor(Math.random() * max)
