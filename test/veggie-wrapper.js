import { api } from '../src'

async function getServiceId (url) {
  const store = await api.getAllServices()
  const id = store.ids
    .find(id => url === store.byId[id].url)

  return id
}

async function getProfileId (name) {
  const store = await api.getAllProfiles()
  const id = store.ids
    .find(id => name === store.byId[id].name)

  return id
}

export async function block (url) {
  const id = await getServiceId(url)
  const payload = { status: 404, response: {} }
  const res = await veggie.setService({ id, payload })

  return res
}

export async function hang (url) {
  const id = await getServiceId(url)
  const payload = { hang: true }
  const res = await veggie.setService({ id, payload })

  return res
}

export async function load (name) {
  const id = await getProfileId(name)
  const res = await veggie.loadProfile({ id })

  return res
}

export async function reset (url) {
  const id = await getServiceId(url)
  const payload = {}
  const res = await veggie.setService({ id, payload })

  return res
}

export async function save (name) {
  const payload = { name }
  const res = await veggie.saveProfile({ payload })

  return res
}

export async function set (url, status, response) {
  const id = await getServiceId(url)
  const payload = { status, response }
  const res = await veggie.setService({ id, payload })

  return res
}
