// URL path for API
export const apiPathPrefix = '/service-profile/api'

// File path for repl socket
export const socketPath = '/tmp/service-profile.sock'

/**
 * Return random number from 0 to time, exclusive
 * @param {number} time - max delay
 * @returns {number}
 */
export const randomExclusive = time => Math.floor(Math.random() * time)
