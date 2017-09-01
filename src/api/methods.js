import fs from 'fs'
import path from 'path'
import { getServices, matchServices } from './services'

// TODO: all blocked needs to actually add all services
let allBlocked = false
let serviceOverrides = {}

export function block (serviceName, statusCode = 404, altResponse = {}) {
  const services = getServices()
  matchServices(services, serviceName, url => {
    console.log(`Blocking ${url} service with ${statusCode} status`)
    serviceOverrides[url] = { statusCode, altResponse }
  })
}

export function blockAll () {
  console.log('Blocking ALL services')
  allBlocked = true
}

export function reset (serviceName) {
  matchServices(serviceOverrides, serviceName, url => {
    console.log(`Reseting ${url} service`)
    delete serviceOverrides[url]
  })
  allBlocked = false
}

export function resetAll () {
  console.log('Reseting ALL services')
  allBlocked = false
  serviceOverrides = {}
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
    const profileSettings = fs.readFileSync(path.join(process.cwd(), profile))
    serviceOverrides = profileSettings
  }
}

