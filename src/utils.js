import { serverError } from './log'

/**
 * Returns an express route handler for the given user-defined response
 *
 * @param {function|object|string} response - The service response
 * @param [optional] {number} statusCode - status code to be used for response
 * @returns {(req: Express Request, res: Express Response) => void}
 */
export function getRouteHandler (url, response, statusCode = null) {
  let responseFn

  if (typeof response === 'function') {
    // Express route - will need to handle status code itself
    responseFn = response
  } else if (typeof response === 'string') {
    // Path to json file
    responseFn = (req, res) => {
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
    responseFn = (req, res) => {
      if (response) {
        res.status(statusCode || 200).json(response)
      }
      else {
        res.status(statusCode || 404).json({})
      }
    }
  }

  const hasQuery = url.indexOf('?') > 0

  if (hasQuery) {
    setQueryResponse(url, responseFn)
    return queryResponseHandler
  } else {
    return responseFn
  }
}

const alphabetize = (a, b) => a.localeCompare(b)
const queryResponse = {}

/**
 * Set the response function based on the query string
 * @param {string} url plus query
 * @param {function} responseFn
 * @returns {void}
 */
function setQueryResponse (url, responseFn) {
  const { baseUrl, query, queryString } = getQueryFromUrl(url)

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
 * @param {string} url
 * @returns {object} query
 */
function getQueryFromUrl (url) {
  let [ baseUrl, query ] = url.split('?')
  let queryString = ''

  if (query !== '') {
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
  const fn = (queryResponse[baseUrl] || {})[queryString || 'fallback']

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
