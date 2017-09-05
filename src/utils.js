import { serverError } from './log'

/**
 * @param {object} data
 * @param {string} queryKey - key to extract from query string
 * @returns {function} - express handler
 */
export function mapQueryParamToKey (data, queryKey) {
  return function (req, res) {
    const queryValue = req.query[queryKey]
    res.send(data[queryValue])
  }
}

export function wrap (key, data) {
  return { [key]: data }
}

export function dWrap (data) {
  return wrap('d', data)
}

/**
 * express handler
 * Return the body of the POST, wrapped in a { d: [body] }
 * @returns {void}
 */
export function mirrorBody (req, res) {
  // Node doesn't support the spread operator on objects, so...
  const response = Object.keys(req.body)
    .reduce((acc, current) => {
      acc[current] = req.body[current]
      return acc
    }, {})
  res.send(dWrap(response))
}

/**
 * @param {string} queryKey
 * @param {object} responses - { String: JSON|Express route|path }
 * @returns {function} - express handler
 */
export function matchKeyToQueryParam (queryKey, responses) {
  return (req, res) => {
    const queryValue = req.query[queryKey]
    const responseKey = Object.keys(responses)
      .find(pattern => {
        const regex = new RegExp(pattern)
        return regex.test(queryValue)
      })
    const callback = getRouteHandler(responses[responseKey])
    callback(req, res)
  }
}

/**
 * Returns an express route handler for the given user-defined response
 *
 * @param {function|object|string} response - The service response
 * @param [optional] {number} statusCode - status code to be used for response
 * @returns {(req: Express Request, res: Express Response) => void}
 */
export function getRouteHandler (response, statusCode = null) {
  if (typeof response === 'function') {
    // Express route - will need to handle status code itself
    return response
  }

  if (typeof response === 'string') {
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
  }

  // JSON object
  const data = response
  return (req, res) => {
    if (data) {
      res.status(statusCode || 200).json(data)
    }
    else {
      res.status(statusCode || 404).json({})
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
