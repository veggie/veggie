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

const GET = 'get'
const POST = 'post'
const PUT = 'put'
const DELETE = 'delete'

const apiConfig = {
  url: `${apiPathPrefix}/${apiVersion}`,
  ping:
  { url: '/ping', method: GET },
  getAllServices:
  { url: '/store', method: GET },
  newService:
  { url: '/store', method: POST },
  getService:
  { url: '/store', method: GET, params: true },
  setService:
  { url: '/store', method: POST, params: true },
  getAllProfiles:
  { url: '/store/profile', method: GET },
  saveProfile:
  { url: '/store/profile', method: POST },
  loadProfile:
  { url: '/store/profile', method: PUT },
  resetProfile:
  { url: '/store/profile', method: DELETE },
  getProfile:
  { url: '/store/profile', method: GET, params: true },
  updateProfile:
  { url: '/store/profile', method: POST, params: true },
  deleteProfile:
  { url: '/store/profile', method: DELETE, params: true }
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
