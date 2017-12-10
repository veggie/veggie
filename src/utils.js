import { serverError } from './log'

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
