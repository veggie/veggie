const assert = require('assert')
const express = require('express')
const veggie = require('../dist/veggie.js')
const veggieApi = require('../dist/veggie.api.js')

require('isomorphic-fetch')

let port = 1337
const fetchJSON = (url, opts) => {
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

describe('a server using veggie middleware', () => {
  let app = express()
  app.use(veggie.middleware({
    dir: 'test/services/**/*.js',
    repl: false,
    time: 0,
    log: false
  }))

  before(() => {
    return new Promise((resolve, reject) => {
      app.listen(1337, resolve)
    })
  })

  it('handles path', () => {
    return fetchJSON('/path')
      .then(({ msg }) => assert(msg === 'path'))
  })

  it('handles static object', () => {
    return fetchJSON('/obj')
      .then(({ msg }) => assert(msg === 'obj'))
  })

  it('handles route function', () => {
    return fetchJSON('/fn')
      .then(({ msg }) => assert(msg === 'fn'))
  })

  it('handles route function with params', () => {
    return fetchJSON('/fn/params/123')
      .then(({ msg, params }) => {
        assert(msg === 'fn')
        assert(typeof params !== 'undefined')
        assert(params.id === '123')
      })
  })

  it('handles route function with query', () => {
    return fetchJSON('/fn/query?id=123')
      .then(({ msg, query }) => {
        assert(msg === 'fn')
        assert(typeof query !== 'undefined')
        assert(query.id === '123')
      })
  })

  it('handles route function with body', () => {
    return fetchJSON('/fn/body', { id: 123 })
      .then(({ msg, body }) => {
        assert(msg === 'fn')
        assert(typeof body !== 'undefined')
        assert(body.id === 123)
      })
  })
})

describe('a server using veggie router', () => {
  let vegServer = veggie.server({
    dir: 'test/services/**/*.js',
    repl: false,
    time: 0,
    log: false
  })

  before(() => {
    ++port
    return new Promise((resolve, reject) => {
      veggieApi._setHost(`http://localhost:${port}`)
      vegServer.listen(port, resolve)
    })
  })

  beforeEach(() => {
    return veggieApi.resetAll()
  })

  it('handles path', () => {
    return fetchJSON('/path')
      .then(({ msg }) => assert(msg === 'path'))
  })

  it('handles static object', () => {
    return fetchJSON('/obj')
      .then(({ msg }) => assert(msg === 'obj'))
  })

  it('handles route function', () => {
    return fetchJSON('/fn')
      .then(({ msg }) => assert(msg === 'fn'))
  })

  it('handles route function with params', () => {
    return fetchJSON('/fn/params/123')
      .then(({ msg, params }) => {
        assert(msg === 'fn')
        assert(typeof params !== 'undefined')
        assert(params.id === '123')
      })
  })

  it('handles route function with query', () => {
    return fetchJSON('/fn/query?id=123')
      .then(({ msg, query }) => {
        assert(msg === 'fn')
        assert(typeof query !== 'undefined')
        assert(query.id === '123')
      })
  })

  it('handles route function with body', () => {
    return fetchJSON('/fn/body', { id: 123 })
      .then(({ msg, body }) => {
        assert(msg === 'fn')
        assert(typeof body !== 'undefined')
        assert(body.id === 123)
      })
  })

  it('can block services', () => {
    return veggieApi.block('/obj')
      .then(() => fetchJSON('/obj'))
      .catch(err => {
        // Catch 404 error
        assert(true)
      })
  })

  it('can reset blocked services', () => {
    return veggieApi.block('/obj')
      .then(() => fetchJSON('/obj'))
      .catch(err => {
        // Catch 404 error
        assert(true)
        return veggieApi.reset('/obj')
      })
      .then(() => fetchJSON('/obj'))
      .then(({ msg }) => assert(msg === 'obj'))
  })
})
