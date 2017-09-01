// TODO: all blocked needs to actually add all services
let allBlocked = false
let serviceOverrides = {}
let services = {}

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

export function block (serviceName, statusCode = 404, altResponse = {}) {
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
