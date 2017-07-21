// todo: find available port
const addr = 1999 // hardcoded to be able to connect
let allBlocked = false
let blockedServices = {}

function profileMiddleware (profile) {
  return (req, res, next) => {
    const { path } = req
    const blocked = Object.keys(blockedServices)
      .find(key => {
        const val = blockedServices[key]
        return val.regex.test(path)
      })
    if (blocked) {
      console.log('Service is blocked')
      return res.status(404).json({})
    }
    next()
  }
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

module.exports = {
  addr,
  profileMiddleware,
  methods: {
    block,
    blockAll,
    reset,
    resetAll,
    show,
    showVerbose
  }
}
