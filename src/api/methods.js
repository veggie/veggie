import fs from 'fs'
import path from 'path'
import { serverLog } from '../log'
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
  serverLog('blocking ALL services')
}

export function reset (serviceName) {
  filterServices(serviceOverrides, serviceName)
    .forEach(url => {
      serverLog(`reseting ${url} service`)
      resetServiceOverride(url)
    })
}

export function resetAll () {
  serverLog('reseting ALL services')
  resetAllServiceOverrides(url)
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
    const profilePath = path.join(process.cwd(), profile)
    const fileData = fs.readFileSync(profilePath)
    setAllServiceOverrides(fileData)
  }
}

