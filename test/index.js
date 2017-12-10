import { getNewPort, fetchJSON } from './utils'
import * as veggie from '../src'

const assert = require('assert')
const express = require('express')
const fs = require('fs')
const path = require('path')

// API
const apiFactory = veggie.api

// Server settings
const serverSettings = {
  dir: 'test/services/**/*.js',
  repl: false,
  time: 0,
  log: false,
  profileDir: 'test/profiles'
}

// Tests to run
const tests = [{
  type: 'middleware',
  init () {
    let app = express()
    app.use(veggie.middleware(serverSettings))

    return app
  }
}, {
  type: 'router',
  init () {
    let app = veggie.server(serverSettings)

    return app
  }
}]

describe('a server', () => {
  tests.forEach(test => {
    describe(`using veggie ${test.type}`, () => {
      let app = test.init()
      let veggieApi

      before(() => {
        return new Promise((resolve, reject) => {
          let port = getNewPort()
          veggieApi = apiFactory(port)
          app.listen(port, resolve)
        })
      })

      beforeEach(() => {
        return veggieApi.resetAll()
      })

      after(() => {
        app.emit('close')
      })

      describe('handles services config', () => {
        describe('from route path', () => {
          let msg

          before(async () => {
            try {
              const res = await fetchJSON('/path')
              msg = res.msg
            } catch (e) {
              assert(false)
            }
          })

          it('by returning correct data', () => {
            assert(msg === 'path')
          })

          it('doesn\'t cache file', () => {
            const test = path.join(__dirname, 'data/test.json')

            // Test that file has not been cached
            assert(typeof require.cache[test] === 'undefined')
          })
        })

        describe('from static JSON object', () => {
          it('by returning correct data', () => {
            return fetchJSON('/obj')
              .then(({ msg }) => assert(msg === 'obj'))
              .catch(() => assert(false)) // Fail
          })
        })

        describe('from route function', () => {
          describe('with no special function', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn')
                .then(({ msg }) => assert(msg === 'fn'))
                .catch(() => assert(false)) // Fail
            })
          })

          describe('with params', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/params/123')
                .then(({ msg, type, params }) => {
                  assert(msg === 'fn')
                  assert(type === 'no-question')
                  assert(typeof params !== 'undefined')
                  assert(params.id === '123')
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe.skip('with params including a ?', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/params/123?')
                .then(({ msg, type, params }) => {
                  assert(msg === 'fn')
                  assert(type === 'question')
                  assert(typeof params !== 'undefined')
                  assert(params.id === '123')
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe.skip('with params including a ? and query param', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/params/123?search=true')
                .then(({ msg, type, params }) => {
                  assert(msg === 'fn')
                  assert(type === 'question-with-query')
                  assert(typeof params !== 'undefined')
                  assert(params.id === '123')
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe('with query', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/query?id=123')
                .then(({ msg, query }) => {
                  assert(msg === 'fn')
                  assert(typeof query !== 'undefined')
                  assert(query.id === '123')
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe('with body', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/body', { id: 123 })
                .then(({ msg, body }) => {
                  assert(msg === 'fn')
                  assert(typeof body !== 'undefined')
                  assert(body.id === 123)
                })
                .catch(() => assert(false)) // Fail
            })
          })
        })

        describe.skip('when route is not defined', () => {
          it('by returning 404', () => {
            return fetchJSON('/undefined')
              .then(() => assert(false)) // Fail
              .catch(error => {
                assert(/404 Not Found/.test(error))
              })
          })
        })
      })


      describe('api', () => {
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
              assert(fs.existsSync(path.join(__dirname, '../test/profiles/newTest.json')))
              fs.unlinkSync(path.join(__dirname, '../test/profiles/newTest.json'))
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
    })
  })
})
