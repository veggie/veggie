// todo: find available port
const addr = 1999 // hardcoded to be able to connect
let allBlocked = false
let blockedServices = {}

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
  let blocked = Object
    .keys(blockedServices)
    .find(key => {
      const val = blockedServices[key]
      return val.regex.test(path)
    })
  if (blocked) {
    // TODO: get actual handler here
    blocked = (req, res, next) => {
      res.status(404).json({})
    }
  }
  return blocked
}

function block (serviceName, statusCode = 404) {
  // TODO: regexp: search through services and add to output JSON
  // TODO: string: add directly to output JSON
  console.log(`Blocking ${serviceName} service`)
  const meta = {
    regex: serviceName instanceof RegExp ? serviceName : new RegExp(serviceName),
    status: statusCode
  }
  blockedServices[serviceName.toString()] = meta
}

function blockAll () {
  console.log('Blocking ALL services')
  allBlocked = true
}

function reset (serviceName) {
  console.log(`Reseting ${serviceName} service`)
  delete blockedServices[serviceName.toString()]
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

function api (method) {
  return () => {
    console.log('calling api')
    return fetch(`/api/profile/${method}`)
  }
}

// Not really necessary. Just complicates everything
const profileClient = {
  block: api('block'),
  blockAll: api('blockAll'),
  reset: api('reset'),
  resetAll: api('resetAll')
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
  profileServer
}
