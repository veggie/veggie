const assert = require('assert')
const path = require('path')
const fs = require('fs')
const express = require('express')
const veggie = require('../dist/veggie.js')
let veggieApi = require('../dist/veggie.api.js').default

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

  after(() => {
    app.emit('close')
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
    log: false,
    profileDir: 'test/profiles'
  })

  before(() => {
    ++port
    return new Promise((resolve, reject) => {
      veggieApi = veggieApi(port)
      vegServer.listen(port, resolve)
    })
  })

  after(() => {
    vegServer.emit('close')
  })


  beforeEach(() => {
    return veggieApi.resetAll()
  })

  it('handles path and doesn\'t cache file', () => {
    return fetchJSON('/path')
      .then(({ msg }) => {
        assert(msg === 'path')

        const test = path.join(__dirname, 'data/test.json')
        // Test that file has not been cached
        assert(typeof require.cache[test] === 'undefined')
      })
      .catch(() => assert(false)) // Fail
  })

  it('handles static object', () => {
    return fetchJSON('/obj')
      .then(({ msg }) => assert(msg === 'obj'))
      .catch(() => assert(false)) // Fail
  })

  it('handles route function', () => {
    return fetchJSON('/fn')
      .then(({ msg }) => assert(msg === 'fn'))
      .catch(() => assert(false)) // Fail
  })

  it('handles route function with params', () => {
    return fetchJSON('/fn/params/123')
      .then(({ msg, params }) => {
        assert(msg === 'fn')
        assert(typeof params !== 'undefined')
        assert(params.id === '123')
      })
      .catch(() => assert(false)) // Fail
  })

  it('handles route function with query', () => {
    return fetchJSON('/fn/query?id=123')
      .then(({ msg, query }) => {
        assert(msg === 'fn')
        assert(typeof query !== 'undefined')
        assert(query.id === '123')
      })
      .catch(() => assert(false)) // Fail
  })

  it('handles route function with body', () => {
    return fetchJSON('/fn/body', { id: 123 })
      .then(({ msg, body }) => {
        assert(msg === 'fn')
        assert(typeof body !== 'undefined')
        assert(body.id === 123)
      })
      .catch(() => assert(false)) // Fail
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
      .catch(() => assert(false)) // Fail
  })

  it('can set a service response', () => {
    return veggieApi.set('/obj', 200, { msg: 'set' })
      .then(() => fetchJSON('/obj'))
      .then(({ msg }) => {
        assert(msg === 'set')
      })
      .catch(() => assert(false)) // Fail
  })

  it('can set a service status code', () => {
    return veggieApi.set('/obj', 400, {})
      .then(() => fetchJSON('/obj'))
      .then(() => assert(false)) // Fail
      .catch(e => {
        assert(/400/.test(e))
      })
  })

  it('can set a service that isn\'t specified by mock data', () => {
    return veggieApi.set('/set', 200, { msg: 'set' })
      .then(() => fetchJSON('/set'))
      .then(({ msg }) => {
        assert(msg === 'set')
      })
      .catch(() => assert(false)) // Fail
  })

  it('can load a profile', () => {
    return veggieApi.load('test')
      .then(() => fetchJSON('/obj'))
      .then(() => assert(false)) // Fail
      .catch(e => assert(/409/.test(e)))
  })

  it('can save a profile', () => {
    return veggieApi.save('newTest')
      .then(() => {
        assert(fs.existsSync(path.join(__dirname, 'profiles/newTest.json')))
        fs.unlinkSync(path.join(__dirname, 'profiles/newTest.json'))
      })
      .catch(() => assert(false))
  })

  it('can hang a service', () => {
    return veggieApi.hang('/obj')
      .then(() => {
        return new Promise((resolve, reject) => {
          setTimeout(resolve, 1000)

          fetchJSON('/obj')
            .then(() => reject(new Error('request did not hang')))
        })
      })
  })
})
