import { api } from '../src'

export async function getServiceId (url) {
  const res = await api.getAllServices()
  const store = res.data
  const id = store.ids
    .find(id => url === store.byId[id].url.full)

  return id
}

export async function getProfileId (name) {
  const res = await api.getAllProfiles()
  const store = res.data
  const id = store.ids
    .find(id => `${name}.json` === store.byId[id].name)

  return id
}

export async function set (url, status, response) {
  const id = await getServiceId(url)
  const payload = { status, response }
  const res = await api.setService({ id, payload })

  return res
}

export async function hang (url) {
    const id = await getServiceId(url)
    const payload = { hang: true }
    const res = await api.setService({ id, payload })

    return res
}

