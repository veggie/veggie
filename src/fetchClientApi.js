require('es6-promise').polyfill()
require('whatwg-fetch')

import { apiPathPrefix } from './common'

// TODO: add arguments and body

// @returns {function}
const api = method => (...args) => fetch(`${apiPathPrefix}/${[method, ...args].join('/')}`)

/**
 * Return method to call api function via fetch
 * @returns {function}
 */
function api (method) {
  return function (...args) {
    const encodedArgs = args.map(arg => encodeURIComponent(arg))
    const path = [method].concat(encodedArgs).join('/')
    return fetch(`${hostname}${apiPathPrefix}/${path}`)
  }
}

export const set = api('set')
export const block = api('block')
export const reset = api('reset')
export const blockAll = api('blockAll')
export const resetAll = api('resetAll')
export const loadProfile = api('loadProfile')
