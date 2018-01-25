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

/* Internal api */
export const _ping = apiCall(apiConfig.ping)

export const _getAllServices = apiCall(apiConfig.getAllServices)
export const _newService = apiCall(apiConfig.newService)

export const _getService = apiCall(apiConfig.getService)
export const _setService = apiCall(apiConfig.setService)

export const _getAllProfiles = apiCall(apiConfig.getAllProfiles)
export const _saveProfile = apiCall(apiConfig.saveProfile)
export const _loadProfile = apiCall(apiConfig.loadProfile)
export const _resetProfile = apiCall(apiConfig.resetProfile)

export const _getProfile = apiCall(apiConfig.getProfile)
export const _updateProfile = apiCall(apiConfig.updateProfile)
export const _deleteProfile = apiCall(apiConfig.deleteProfile)

/* Helper functions */

export async function _getServiceId (url) {
  const { data } = await _getAllServices()
  const id = data.ids
    .find(id => url === data.byId[id].url.full)

  return id
}

export async function _getProfileId (name) {
  const { data } = await _getAllProfiles()
  const id = data.ids
    .find(id => `${name}.json` === data.byId[id].name)

  return id
}

/* User-friendly api */

export async function set (url, status, response) {
  const id = await _getServiceId(url)
  const payload = { status, response }
  const res = await _setService({ id, payload })

  return res
}

export function block (url) {
  return set(url, 404, {})
}

export function reset (url) {
  return set(url)
}

export function resetAll () {
  return _resetProfile()
}

export async function hang (url) {
    const id = await _getServiceId(url)
    const payload = { hang: true }
    const res = await _setService({ id, payload })

    return res
}

export async function load (name) {
  const id = await _getProfileId(name)
  const res = await _loadProfile({ id })

  return res
}

export function setApiOrigin (origin = 'http://localhost:1337') {
  const hasProtocol = /\w+\:\/\//.test(origin)
  fetchOrigin = hasProtocol ? origin : `http://${origin}`
}
