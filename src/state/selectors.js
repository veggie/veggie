import express from 'express'
import store from './store'
import { getQueryHandler } from '../utils'

export function delaySel () {
  return store.getState().delay
}

export function logSel () {
  return store.getState().log
}

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

const routerCache = {}
export function routerSel () {
  if (routerCache.id === store.getState().id) {
    return routerCache.router
  }

  const { ids, byId } = store.getState().services
  const map = ids
    .reduce((acc, id) => {
      const service = byId[id]
      const method = service.method
      const url = service.url.baseUrl

      acc[method] = acc[method] || {}
      acc[method][url] = acc[method][url] || []
      acc[method][url].push(id)

      return acc
    }, {})

  // 'all' method should come first so as to be higher priority than other methods
  const methodOrder = Object.keys(map)
    .sort((methodA, methodB) => {
      if (methodA === 'all') {
        return 1
      } else if (methodB === 'all') {
        return -1
      } else {
        return 0
      }
    })

  const router = express.Router()

  for (let method of methodOrder) {
    for (let url in map[method]) {
      router[method](url, getQueryHandler(map[method][url]))
    }
  }

  routerCache.id = store.getState().id
  routerCache.router = router

  return router
}
