import express from 'express'
import store from './store'
import { getQueryHandler } from '../utils'

export function delaySel () {
  return store.getState().delay
}

export function logSel () {
  return store.getState().log
}

export function serviceByIdSel (id) {
  return store.getState().services.byId[id]
}

export function servicesSel () {
  return store.getState().services
}

export function profilesSel () {
  return store.getState().profiles
}

export function profileByIdSel (id) {
  return store.getState().profiles.byId[id]
}

export function profileDirSel () {
  return store.getState().profiles.dir
}

export function currentOverridesSel () {
  const { ids, byId } = store.getState().services
  const map = ids
    .reduce((acc, id) => {
      const service = byId[id]
      const { url } = service

      if (service.override) {
        acc[url.full] = service.override
      }

      return acc
    }, {})

  return map
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
      const { method } = service
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
