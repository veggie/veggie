/**
 * @param {object} data
 * @param {string} queryKey - key to extract from query string
 * @returns {function} - express handler
 */
export function mapQueryParamToKey (data, queryKey) {
  return function (req, res) {
    const queryValue = req.query[queryKey]
    send(res, data[queryValue])
  }
}

export function send (res, data) {
  res.send(data)
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
  send(res, dWrap(response))
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
    callback(res)
  }
}

/**
 * Returns an express route handler for the given service
 *
 * @param {function|object|string} response - The service response
 * @returns {(req: Express Request, res: Express Response) => void}
 */
export function getRouteHandler (response) {
  if (typeof response === 'function') {
    // Express route
    return response
  }

  if (typeof response === 'string') {
    // Path to json file
    return (req, res) => {
      const data = cachelessRequire(response)
      if (data) {
        res.json(data)
      }
      else {
        res.status(404).json({})
      }
    }
  }

  // JSON object
  const data = response
  return (req, res) => {
    if (data) {
      res.json(data)
    }
    else {
      res.status(404).json({})
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
