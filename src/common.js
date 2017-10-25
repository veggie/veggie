/**
 * URL path for API
 */
export const apiPathPrefix = '/veggie/api'

/**
 * File path for repl socket
 */
export const socketPath = '/tmp/veggie.sock'

/**
 * Return random number from 0 to time, exclusive
 * @param {number} time - max delay
 * @returns {number}
 */
export const randomExclusive = time => Math.floor(Math.random() * time)
