/**
 * @param {Object} data
 * @param {String} queryKey - key to extract from query string
 * @returns {Function} - route callback sending json
 */
export function mapQueryParamToKey (data, queryKey) {
  return function (req, res) {
    const queryValue = req.query[queryKey]
    res.json(data[queryValue])
  }
}

/**
 * Return the body of the POST, wrapped in a { d: [body] }
 */
export function mirrorBody (req, res) {
  // Node doesn't support the spread operator on objects, so...
  const response = Object.keys(req.body)
    .reduce((acc, current) => {
      acc[current] = req.body[current]
      return acc
    }, {})
  res.send({ d: response })
}
