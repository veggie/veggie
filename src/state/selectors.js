import store from './store'

export function serviceIdByUrlSel (url) {
  const state = store.getState()
  const id = state.services.ids.find(id => {
    return state.services.byId[id].url === url
  })

  return id
}

export function serviceByIdSel (id) {
  return store.getState().services.byId[id]
}

export function servicesSel () {
  return store.getState().services
}

export function profilesSel () {
  return store.getState().profiles.byId
}

export function profileByIdSel (id) {
  return store.getState().profiles.byId[id]
}

export function profileDirSel () {
  return store.getState().profiles.dir
}

export function profileDataSel () {
  return store.getState().profiles.data
}
