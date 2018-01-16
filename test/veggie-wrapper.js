import { api } from '../src'

async function getServiceId (url) {
  const res = await api.getAllServices()
  const store = res.data
  const id = store.ids
    .find(id => url === store.byId[id].url.full)

  return id
}

async function getProfileId (name) {
  const res = await api.getAllProfiles()
  const store = res.data
  const id = store.ids
    .find(id => name === store.byId[id].name)

  return id
}

export async function block (url) {
  const id = await getServiceId(url)
  const payload = { status: 404, response: {} }
  const res = await api.setService({ id, payload })

  return res
}

export async function hang (url) {
  const id = await getServiceId(url)
  const payload = { hang: true }
  const res = await api.setService({ id, payload })

  return res
}

export async function load (name) {
  const id = await getProfileId(name)
  const res = await api.loadProfile({ id })

  return res
}

export async function reset (url) {
  const id = await getServiceId(url)
  const payload = {}
  const res = await api.setService({ id, payload })

  return res
}

export async function save (name) {
  const payload = { name }
  const res = await api.saveProfile({ payload })

  return res
}

export async function set (url, status, response) {
  const id = await getServiceId(url)
  const payload = { status, response }
  const res = await api.setService({ id, payload })

  return res
}
