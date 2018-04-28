/* globals describe it before beforeEach after */
import { getNewPort, fetchJSON, includesArray } from './utils'
import { api, middleware, server } from '../src'

const assert = require('assert')
const express = require('express')
const fs = require('fs')
const path = require('path')
const veggieApi = api

// Server settings
const serverSettings = {
  dir: 'test/services/**/*.js',
  time: 0,
  log: false,
  profileDir: 'test/profiles'
}

// Tests to run
const tests = [{
  type: 'middleware',
  init () {
    let app = express()
    app.use(middleware(serverSettings))

    return app
  }
}, {
  type: 'router',
  init () {
    let app = server(serverSettings)

    return app
  }
}]

describe('a server', () => {
  describe('started with a profile', () => {
    let app
    before(() => {
      app = server({
        dir: 'test/services/**/*.js',
        time: 0,
        log: false,
        profileDir: 'test/profiles',
        profile: 'test'
      })

      return new Promise((resolve, reject) => {
        let port = getNewPort()
        veggieApi.setApiOrigin(`localhost:${port}`)
        app.listen(port, resolve)
      })
    })

    after(() => {
      app.emit('close')
    })

    it('will load profile and return correct data', () => {
      return fetchJSON('/obj')
        .then(() => assert(false)) // Fail
        .catch(e => assert(/409/.test(e)))
    })
  })

  tests.forEach(test => {
    describe(`using veggie ${test.type}`, () => {
      let app

      before(() => {
        return new Promise((resolve, reject) => {
          app = test.init()
          let port = getNewPort()
          veggieApi.setApiOrigin(`http://localhost:${port}`)
          app.listen(port, resolve)
        })
      })

      beforeEach(() => {
        return veggieApi._resetProfile()
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

          describe('with question mark', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/question?')
                .then(({ msg, type }) => {
                  assert(msg === 'fn')
                  assert(type === 'question')
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe('with question mark and query param', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/question?search=true')
                .then(({ msg, type, val }) => {
                  assert(msg === 'fn')
                  assert(type === 'question-with-query')
                  assert(val === true)
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe('with question mark and identical query param', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/question?search=false')
                .then(({ msg, type, val }) => {
                  assert(msg === 'fn')
                  assert(type === 'question-with-query')
                  assert(val === false)
                })
                .catch(() => assert(false)) // Fail
            })
          })

          describe('with question mark and identical query param and more matches', () => {
            it('by returning correct data', () => {
              return fetchJSON('/fn/question?search=false&format=json')
                .then(({ msg, type, val }) => {
                  assert(msg === 'fn')
                  assert(type === 'question-with-query')
                  assert(val === 'json')
                })
                .catch(() => assert(false)) // Fail
            })
          })
        })

        describe('when route is not defined', () => {
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
        it('will pong a ping', () => {
          return veggieApi._ping()
            .then(res => assert(res.message === 'pong'))
            .catch(() => assert(false)) // Fail
        })

        it('can get all loaded service configs', () => {
          return veggieApi._getAllServices()
            .then(res => {
              const firstKeys = ['status', 'data']
              const hasFirstKeys = includesArray(Object.keys(res), firstKeys)
              assert(hasFirstKeys)

              const dataKeys = ['ids', 'byId']
              const hasDataKeys = includesArray(Object.keys(res.data), dataKeys)
              assert(hasDataKeys)
            })
        })

        it('can get the config for a single service', () => {
          return veggieApi._getServiceId('/obj')
            .then(id => {
              return veggieApi._getService({ id })
            })
            .then(res => {
              const firstKeys = ['status', 'data']
              const hasFirstKeys = includesArray(Object.keys(res), firstKeys)
              assert(hasFirstKeys)

              const dataKeys = ['id', 'url', 'status', 'method', 'response', 'type', 'override']
              const hasDataKeys = includesArray(Object.keys(res.data), dataKeys)
              assert(hasDataKeys)
            })
        })

        it('can get all available profiles', () => {
          return veggieApi._getAllProfiles()
            .then(res => {
              const firstKeys = ['status', 'data']
              const hasFirstKeys = includesArray(Object.keys(res), firstKeys)
              assert(hasFirstKeys)

              const dataKeys = ['dir', 'current', 'ids', 'byId', 'data']
              const hasDataKeys = includesArray(Object.keys(res.data), dataKeys)
              assert(hasDataKeys)
            })
        })

        it('can get the config for a single profile', () => {
          return veggieApi._getProfileId('test')
            .then(id => {
              return veggieApi._getProfile({ id })
            })
            .then(res => {
              const firstKeys = ['status', 'data']
              const hasFirstKeys = includesArray(Object.keys(res), firstKeys)
              assert(hasFirstKeys)

              const dataKeys = ['id', 'name', 'requirePath', 'data']
              const hasDataKeys = includesArray(Object.keys(res.data), dataKeys)
              assert(hasDataKeys)
            })
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

        it('can create a service that isn\'t specified by service configs', () => {
          return veggieApi._newService({ payload: { url: '/set', status: 200, response: { msg: 'set' } } })
            .then(() => fetchJSON('/set'))
            .then(({ msg }) => assert(msg === 'set'))
            .catch(e => assert(false)) // Fail
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

        it('can reset a service override', () => {
          return veggieApi.set('/obj', 404, {})
            .then(() => fetchJSON('/obj'))
            .catch(() => {
              // Catch 404 error
              assert(true)
              return veggieApi.set('/obj')
            })
            .then(() => fetchJSON('/obj'))
            .then(({ msg }) => assert(msg === 'obj'))
            .catch(() => assert(false)) // Fail
        })

        it('can load a profile', () => {
          return veggieApi._getProfileId('test')
            .then(id => veggieApi._loadProfile({ payload: { id } }))
            .then(() => fetchJSON('/obj'))
            .then(d => assert(false)) // Fail
            .catch(e => assert(/409/.test(e)))
        })

        it('can save an empty profile to disk', () => {
          return veggieApi._saveProfile({ payload: { name: 'newTest' } })
            .then(() => {
              assert(fs.existsSync(path.join(__dirname, '../test/profiles/newTest.json')))

              const profile = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/profiles/newTest.json')))
              assert(profile !== undefined)

              // Cleanup
              fs.unlinkSync(path.join(__dirname, '../test/profiles/newTest.json'))
            })
          .catch(() => assert(false))
        })

        it('can update a loaded profile', () => {
          return veggieApi._newService({ payload: { url: '/new-service', status: 301, response: { msg: 'new-service' } } })
            .then(() => veggieApi._saveProfile({ payload: { name: 'newProfile' } }))
            .then(() => veggieApi._newService({ payload: { url: '/other-new-service', status: 302, response: { msg: 'other-new-service' } } }))
            .then(() => veggieApi._getProfileId('newProfile'))
            .then(id => veggieApi._updateProfile({ id }))
            .then(() => {
              assert(fs.existsSync(path.join(__dirname, '../test/profiles/newProfile.json')))

              const profile = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/profiles/newProfile.json')))
              assert(profile !== undefined)
              assert(profile['/new-service'].status === 301)
              assert(profile['/other-new-service'].status === 302)

              // Cleanup
              fs.unlinkSync(path.join(__dirname, '../test/profiles/newProfile.json'))
            })
        })

        it('can delete a profile', () => {
          return veggieApi._newService({ payload: { url: '/temp-service', status: 303, response: { msg: 'temp-service' } } })
            .then(() => veggieApi._saveProfile({ payload: { name: 'tempProfile' } }))
            .then(() => veggieApi._resetProfile())
            .then(() => veggieApi._getProfileId('tempProfile'))
            .then(id => veggieApi._deleteProfile({ id }))
            .then(() => {
              const profileExists = fs.existsSync(path.join(__dirname, '../test/profiles/tempProfile.json'))
              assert(!profileExists)
            })
        })

        it('can delete the current profile', () => {
          return veggieApi._newService({ payload: { url: '/temp2-service', status: 303, response: { msg: 'temp2-service' } } })
            .then(() => veggieApi._saveProfile({ payload: { name: 'temp2Profile' } }))
            .then(() => veggieApi._getProfileId('temp2Profile'))
            .then(id => veggieApi._deleteProfile({ id }))
            .then(() => {
              const profileExists = fs.existsSync(path.join(__dirname, '../test/profiles/temp2Profile.json'))
              assert(!profileExists)
            })
        })
      })
    })
  })
})
