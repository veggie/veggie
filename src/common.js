// Path for API
export const apiPathPrefix = '/service-profile/api'

// Path for repl socket
export const socketPath = '/tmp/service-profile.sock'

/**
 * Return random delay from 0 to time, exclusive
 * @param {number} time - max delay
 * @returns {number}
 */
export const randomExclusive = time => Math.floor(Math.random() * time)
