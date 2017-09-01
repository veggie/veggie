import express from 'express'

let services = {}
let profileRouter

export function matchServices (services, serviceName, cb) {
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

export function getServices () {
  return services
}

export function setServices (serviceMap) {
  services = serviceMap
}

export function getRouter () {
  return profileRouter
}

export function setRouter () {
  const router = express.Router()
  // TODO: add profile override routes
  profileRouter = router
}
