/**
 * @param {Object} data
 * @param {String} queryKey - key to extract from query string
 * @returns {Function} - express handler
 */
export function mapQueryParamToKey (data, queryKey) {
  return function (req, res) {
    const queryValue = req.query[queryKey]
    send(res, data[queryValue])
    res.json(data[queryValue])
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
