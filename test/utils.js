/* globals fetch */
import 'isomorphic-fetch'

let port = 1337

export function getNewPort () {
  return ++port
}

export function fetchJSON (url, opts) {
  if (opts) {
    opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts)
    }
  }
  return fetch(`http://localhost:${port}${url}`, opts).then(res => {
    if (res.status > 200) {
      throw new Error(`${res.status} ${res.statusText}`)
    } else {
      return res.json()
    }
  })
}

export function includesArray (arr, included) {
  return arr.every(el => included.includes(el))
}
