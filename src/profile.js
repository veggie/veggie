// todo: find available port
const addr = 1999 // hardcoded to be able to connect
let allBlocked = false
let blockedServices = {}
let services = {}

function profileMiddleware (profile) {
  return (req, res, next) => {
    const { path } = req
    const blockedHandler = getBlockedHandler(path)
    if (blockedHandler) {
      console.log('Service is blocked')
      blockedHandler(req, res, next)
    }
    next()
  }
}

function getBlockedHandler (path) {
  let blocked = blockedServices[path]
  if (blocked) {
    const { status, response } = blocked
    blocked = (req, res, next) => {
      res.status(status).json(response)
    }
  }
  return blocked
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
    blockedServices[url] = { statusCode, altResponse }
  })
}

function blockAll () {
  console.log('Blocking ALL services')
  allBlocked = true
}

function reset (serviceName) {
  matchServices(blockedServices, serviceName, url => {
    console.log(`Reseting ${url} service`)
    delete blockedServices[url]
  })
  allBlocked = false
}

function resetAll () {
  console.log('Reseting ALL services')
  allBlocked = false
  blockedServices = {}
}

function showVerbose () {
  return blockedServices
}

function show () {
  return Object.keys(blockedServices)
}

function setAvailableServices (serviceMap) {
  services = serviceMap
}

const profileServer = {
  block,
  blockAll,
  reset,
  resetAll,
  show,
  showVerbose
}

export {
  addr,
  getBlockedHandler,
  profileClient,
  profileMiddleware,
  profileServer,
  setAvailableServices
}
