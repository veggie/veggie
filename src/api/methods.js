import fs from 'fs'
import path from 'path'
import { serverError, serverLog } from '../log'
import {
  filterServices, services, serviceOverrides,
  setServiceOverride, resetServiceOverride,
  setAllServiceOverrides, resetAllServiceOverrides
} from './services'

export function block (serviceName, status = 404, response = {}) {
  const matchingServices = filterServices(services, serviceName)

  if (matchingServices.length > 0) {
    let message
    matchingServices.forEach(url => {
      message = `blocking ${url} service with ${status} status`
      serverLog(message)
      setServiceOverride(url, { status, response })
    })
    return message
  } else {
    let error = `could not find ${serviceName} service to block`
    serverError(error)
    throw new Error(error)
  }
}

export function blockAll (status = 500, response = {}) {
  // TODO: all blocked needs to actually add all services
  let message = 'blocking all services'
  serverLog(message)
  return message
}

export function reset (serviceName) {
  const matchingServices = filterServices(serviceOverrides, serviceName)

  if (matchingServices.length > 0) {
    let message
    matchingServices.forEach(url => {
      message = `reseting ${url} service`
      serverLog(message)
      resetServiceOverride(url)
    })
    return message
  } else {
    let error = `could not find ${serviceName} service to reset`
    serverError(error)
    throw new Error(error)
  }
}

export function resetAll () {
  let message = 'reseting all services'
  serverLog(message)
  resetAllServiceOverrides()
  return message
}

export function show () {
  return Object.keys(serviceOverrides)
}

export function showAll () {
  return serviceOverrides
}

export function set (serviceName, status, response) {
  const config = { status, response }
  const matchingServices = filterServices(services, serviceName)
  let message

  if (matchingServices.length > 0) {
    matchingServices.forEach(url => {
      message = `setting override for ${url} service with ${status} status`
      setServiceOverride(url, config)
    })
  } else {
    message = `service ${serviceName} not found. setting response for new service with ${status} status`
    setServiceOverride(serviceName, config)
  }

  serverLog(message)
  return message
}

export function load (profileName) {
  resetAll()

  if (profileName) {
    let profilePath = profileName
    try {
      // Add json extension
      if (!profilePath.includes('.json')) {
        profilePath = `${profilePath}.json`
      }

      // Make path absolute
      if (!path.isAbsolute(profilePath)) {
        profilePath = path.join(profileDir, profilePath)
      }

      const fileData = fs.readFileSync(profilePath)
      const profileData = JSON.parse(fileData)
      setAllServiceOverrides(profileData)

      let message = `loading ${profileName} profile`
      serverLog(message)
      return message
    } catch (e) {
      error = `loading ${profileName} profile failed at ${profilePath}`
      serverError(error)
      throw new Error(error)
    }
  } else {
    error = 'load requires a name'
    serverError(error)
    throw new Error(error)
  }
}

export function save (profileName) {
  if (profileName) {
    let profilePath = profileName
    try {
      // Add json extension
      if (!profilePath.includes('.json')) {
        profilePath = `${profilePath}.json`
      }

      // Make path absolute
      if (!path.isAbsolute(profilePath)) {
        profilePath = path.join(profileDir, profilePath)
      }

      fs.writeFileSync(profilePath, JSON.stringify(serviceOverrides, null, 2))

      let message = `saving ${profileName} profile`
      serverLog(message)
      return message
    } catch (e) {
      error = `saving ${profileName} profile failed at ${profilePath}`
      serverError(error)
      throw new Error(error)
    }
  } else {
    error = 'save requires a name'
    serverError(error)
    throw new Error(error)
  }
}

export function hang (serviceName, time = Infinity) {
  const matchingServices = filterServices(services, serviceName)

  if (matchingServices.length > 0) {
    let message
    matchingServices.forEach(url => {
      message = `hanging ${url} service for ${time}s`
      serverLog(message)
      setServiceOverride(url, { hang: time })
    })
    return message
  } else {
    let error = `could not find ${serviceName} service to hang`
    serverError(error)
    throw new Error(error)
  }
}

// Directory for saving/loading profiles
let profileDir = process.cwd()

/**
 * Setter function for profileDir
 *
 * @param {string} dir - absolute path to profile directory
 * @returns {void}
 */
export function _setProfileDir (dir) {
  profileDir = dir
}

