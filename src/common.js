/**
 * URL path for API
 */
export const apiPathPrefix = '/veggie/api'

/**
 * File path for repl socket
 */
export const socketPath = '/tmp/veggie.sock'

/**
 * Return random number from 0 to max, exclusive
 * @param {number} max
 * @returns {number}
 */
export const randomExclusive = max => Math.floor(Math.random() * max)
