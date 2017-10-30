export let services = {}
export let serviceOverrides = {}

/**
 * @param {object} services - services to search through
 * @param {regex|string} serviceName - match to compare with service url
 * @returns {array} - array of matching services
 */
export function filterServices (services, serviceName, cb) {
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
}

export function setServices (serviceMap = {}) {
  services = serviceMap
}

export function setServiceOverride (url, override) {
  serviceOverrides[url] = override
}

export function setAllServiceOverrides (overrides = {}) {
  serviceOverrides = overrides
}

export function resetServiceOverride (url) {
  delete serviceOverrides[url]
}

export function resetAllServiceOverrides () {
  serviceOverrides = {}
}
