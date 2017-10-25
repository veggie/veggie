import fs from 'fs'
import path from 'path'
import { serverError, serverLog } from '../log'
import {
  filterServices, services, serviceOverrides,
  setServiceOverride, resetServiceOverride,
  setAllServiceOverrides, resetAllServiceOverrides
} from './services'

export function block (serviceName, statusCode = 404, altResponse = {}) {
  filterServices(services, serviceName)
    .forEach(url => {
      serverLog(`blocking ${url} service with ${statusCode} status`)
      setServiceOverride(url, { statusCode, altResponse })
    })
}

export function blockAll () {
  // TODO: all blocked needs to actually add all services
  serverLog('blocking all services')
}

export function set (serviceName, status, response) {
  serverLog('setting override')
}

export function reset (serviceName) {
  filterServices(serviceOverrides, serviceName)
    .forEach(url => {
      serverLog(`reseting ${url} service`)
      resetServiceOverride(url)
    })
}

export function resetAll () {
  serverLog('reseting all services')
  resetAllServiceOverrides()
}

export function showAll () {
  return serviceOverrides
}

export function show () {
  return Object.keys(serviceOverrides)
}

export function loadProfile (profile) {
  resetAll()
  if (profile) {
    serverLog(`loading ${profile} profile`)
    try {
      const profilePath = path.join(process.cwd(), profile)
      const fileData = fs.readFileSync(profilePath)
      const profileData = JSON.parse(fileData)
      setAllServiceOverrides(profileData)
    } catch (e) {
      serverError(`loading ${profile} profile failed`)
    }
  }
}

