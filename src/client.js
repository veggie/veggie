import { apiPathPrefix, apiVersion } from './common'

// /veggie/api/v1/ping - GET - ping
// /veggie/api/v1/store - GET - getAllServices
// /veggie/api/v1/store - POST - newService
// /veggie/api/v1/store/:id - GET - getService
// /veggie/api/v1/store/:id - POST - setService (block, reset, hang)
// /veggie/api/v1/store/profile - GET - getAllProfiles
// /veggie/api/v1/store/profile - POST - saveProfile
// /veggie/api/v1/store/profile - PUT - loadProfile
// /veggie/api/v1/store/profile - DELETE - resetProfile
// /veggie/api/v1/store/profile/:id - GET - getProfile
// /veggie/api/v1/store/profile/:id - POST - updateProfile
// /veggie/api/v1/store/profile/:id - DELETE - deleteProfile

const apiConfig = {
  url: `${apiPathPrefix}/${apiVersion}`,
  ping: {
    url: '/ping',
    method: 'get'
  },
  getAllServices: {
    url: '/store',
    method: 'get'
  },
  newService: {
    url: '/store',
    method: 'post'
  },
  getService: {
    url: '/store',
    method: 'get',
    params: true
  },
  setService: {
    url: '/store',
    method: 'post',
    params: true
  },
  getAllProfiles: {
    url: '/store/profile',
    method: 'get'
  },
  saveProfile: {
    url: '/store/profile',
    method: 'post'
  },
  loadProfile: {
    url: '/store/profile',
    method: 'put'
  },
  resetProfile: {
    url: '/store/profile',
    method: 'delete'
  },
  getProfile: {
    url: '/store/profile',
    method: 'get',
    params: true
  },
  updateProfile: {
    url: '/store/profile',
    method: 'post',
    params: true
  },
  deleteProfile: {
    url: '/store/profile',
    method: 'post',
    params: true
  }
}

let fetchOrigin = ''
function fetchWrapper(path, options) {
  return fetch(`${fetchOrigin}${path}`, options)
}

function apiCall ({ url, params, method }, hardcodedPayload) {
  return async (args = {}) => {
    const { id, payload } = args
    let apiPath = `${apiConfig.url}${url}`

    if (params && id) {
      apiPath = `${apiPath}/${id}`
    }

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (hardcodedPayload || payload) {
      options.body = JSON.stringify(hardcodedPayload || payload)
    }

    return fetchWrapper(apiPath, options)
      .then(res => res.json())
  }
}

export const ping = apiCall(apiConfig.ping)

export const getAllServices = apiCall(apiConfig.getAllServices)
export const newService = apiCall(apiConfig.newService)

export const getService = apiCall(apiConfig.getService)
export const setService = apiCall(apiConfig.setService)

export const getAllProfiles = apiCall(apiConfig.getAllProfiles)
export const saveProfile = apiCall(apiConfig.saveProfile)
export const loadProfile = apiCall(apiConfig.loadProfile)
export const resetProfile = apiCall(apiConfig.resetProfile)

export const getProfile = apiCall(apiConfig.getProfile)
export const updateProfile = apiCall(apiConfig.updateProfile)
export const deleteProfile = apiCall(apiConfig.deleteProfile)

export function setApiOrigin (origin = 'http://localhost:1337') {
  const hasProtocol = /\w+\:\/\//.test(origin)
  fetchOrigin = hasProtocol ? origin : `http://${origin}`
}
