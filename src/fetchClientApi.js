import { apiPathPrefix } from './common'

/**
 * Available api methods
 */
const apiMethods = [
  'block',
  'blockAll',
  'reset',
  'resetAll',
  'show',
  'showAll',
  'set',
  'load'
]

export const block = api('block')
export const blockAll = api('blockAll')
export const reset = api('reset')
export const resetAll = api('resetAll')
export const show = api('show')
export const showAll = api('showAll')
export const set = api('set')
export const load = api('load')

/**
 * Get api for a particular host
 *
 * @param {number} port
 * @param {string} host
 * @returns {object} api
 */
export default function (port = 1337, host = 'http://localhost') {
  const hostname = `${host}:${port}`
  return apiMethods
    .reduce((acc, method) => {
      acc[method] = api(method, hostname)
      return acc
    }, {})
}

/**
 * Return method to call api function via fetch
 * @returns {function}
 */
function api (method, hostname = '') {
  return function (name, ...args) {
    const encodedName = encodeURIComponent(name)

    if (!name) {
      // API has no paramters
      return fetch(`${hostname}${apiPathPrefix}/${method}`)
    } else if (args.length > 0) {
      // API receives POSTed body
      return fetch(`${hostname}${apiPathPrefix}/${method}/${encodedName}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      })
    } else {
      // API receives a single name
      return fetch(`${hostname}${apiPathPrefix}/${method}/${encodedName}`)
    }
  }
}
