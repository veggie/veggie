import fs from 'fs'
import getPort from 'get-port'
import path from 'path'
// todo: find available port
const addr = 1999 // hardcoded to be able to connect
let allBlocked = false
let serviceOverrides = {}
let services = {}

function getApiHandler (url) {
  const match = middlewareApiRegex.exec(url)
  if (match) {
    const [ /* ignore */, method, arg ] = match
    if (profileMethods[method]) {
      return (req, res) => {
        if (arg) {
          profileMethods[method](arg)
        } else {
          profileMethods[method]()
        }
        res.end()
      }
    }
  }
  return
}

function profileMiddleware (profile) {
  return (req, res, next) => {
    const { path } = req
    const profileOverrideHandler = getProfileOverrideHandler(path)
    if (profileOverrideHandler) {
      profileOverrideHandler(req, res, next)
      // TODO: should this return?
    }
    next()
  }
}

function getProfileOverrideHandler (path) {
  let override = serviceOverrides[path]
  if (override) {
    const { status, response } = override
    return (req, res, next) => {
      res.status(status).json(response)
    }
  }
  return
}

function matchServices (services, serviceName, cb) {
  const isRegex = serviceName instanceof RegExp
  return Object
    .keys(services)
    .filter(url => {
      if (isRegex) {
        return serviceName.test(url)
      } else {
        return url === serviceName
      }
    })
    .forEach(url => {
      cb(url, services[url])
    })
}

function block (serviceName, statusCode = 404, altResponse = {}) {
  matchServices(services, serviceName, url => {
    console.log(`Blocking ${url} service with ${statusCode} status`)
    serviceOverrides[url] = { statusCode, altResponse }
  })
}

function blockAll () {
  console.log('Blocking ALL services')
  allBlocked = true
}

function reset (serviceName) {
  matchServices(serviceOverrides, serviceName, url => {
    console.log(`Reseting ${url} service`)
    delete serviceOverrides[url]
  })
  allBlocked = false
}

function resetAll () {
  console.log('Reseting ALL services')
  allBlocked = false
  serviceOverrides = {}
}

function showVerbose () {
  return serviceOverrides
}

function show () {
  return Object.keys(serviceOverrides)
}

function setAvailableServices (serviceMap) {
  services = serviceMap
}

function loadProfile (profile) {
  resetAll()
  const profileSettings = fs.readFileSync(path.join(process.cwd(), profile))
  serviceOverrides = profileSettings
  return
}

const profileMethods = {
  block,
  blockAll,
  reset,
  resetAll,
  loadProfile,
  show,
  showVerbose
}

export {
  addr,
  getApiHandler,
  getProfileOverrideHandler,
  profileClient,
  profileMiddleware,
  profileMethods,
  setAvailableServices
}
