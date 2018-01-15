import { serverError } from './log'

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
const queryResponse = {}

/**
 * Set the response function based on the query string
 *
 * @param {string} url plus query
 * @param {function} responseFn
 * @returns {void}
 */
function setQueryResponse (url, responseFn) {
  const { baseUrl, query, queryString } = getQueryFromUrl(url)

  console.log('set', baseUrl, queryString)

  if (query) {
    // Set response function
    queryResponse[baseUrl] = Object.assign(
      queryResponse[baseUrl] || {},
      { [queryString]: responseFn }
    )
  } else {
    // Set fallback response function
    queryResponse[baseUrl] = Object.assign(
      queryResponse[baseUrl] || {},
      { fallback: responseFn }
    )
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

function queryResponseHandler (req, res) {
  const { baseUrl, query, queryString } = getQueryFromUrl(req.url)
  const service = queryResponse[baseUrl] || {}

  const fn = service[queryString] || service.fallback

  console.log('get', !!fn, baseUrl, query, queryString, !!service[queryString], !!service.fallback)

  if (fn) {
    return fn(req, res)
  } else {
    throw new Error('callback not found')
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
 * Find matching services
 *
 * @param {object} services - services to search through
 * @param {regex|string} serviceName - match to compare with service url
 * @returns {array} - array of matching services
 */
export function filter (services, serviceName) {
  const isRegex = serviceName instanceof RegExp

  return Object
    .keys(services)
    .filter(url => {
      if (isRegex) {
        return serviceName.test(url)
      } else {
        return url === serviceName
      }
    })
}

/**
 * Return random number from 0 to max, exclusive
 * @param {number} max
 * @returns {number}
 */
export const randomExclusive = max => Math.floor(Math.random() * max)
