import express from 'express'
import store from './state/store'
import { serverError, serverLog } from './log'
import { apiPathPrefix, apiVersion } from './common'
import {
  profileByIdSel,
  profilesSel,
  serviceByIdSel,
  servicesSel
} from './state/selectors'
import {
  breakRouterCache,
  deleteProfile,
  newServiceWithOverride,
  setCurrentProfileId,
  setStateAsProfile,
  setOverride,
  updateProfileWithState
} from './state/reducers'

export const apiRouter = express.Router()
export const apiPath = `${apiPathPrefix}/${apiVersion}`

apiRouter.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

/**
 * ping
 *
 * @method GET
 * @path /ping
 */
apiRouter.get('/ping', (req, res) => {
  res.send({ status: 'success', message: 'pong' })
})

/**
 * getService
 *
 * @method GET
 * @path /veggie/api/v1/store/profile/:id
 *
 * @params id
 */
apiRouter.get('/store/profile/:id', (req, res) => {
  const { id } = req.params
  const data = profileByIdSel(id)

  if (data) {
    res.send({ status: 'success', data })
  } else {
    res.status(404).send({ status: 'failed' })
  }
})

/**
 * updateProfile
 *
 * @method POST
 * @path /veggie/api/v1/store/profile/:id
 * @params id
 */
apiRouter.post('/store/profile/:id', (req, res) => {
  const { id } = req.params
  const profile = profileByIdSel(id)

  if (profile) {
    let message = `updating profile ${id}`

    store.dispatch(
      updateProfileWithState(id)
    )

    serverLog(message)
    res.send({ status: 'success', message })
  } else {
    const error = 'profile not found'
    serverError(error)

    res.status(400).send({ status: 'failed', error })
  }
})

/**
 * deleteProfile
 *
 * @path /veggie/api/v1/store/profile/:id
 * @method DELETE
 * @params id
 */
apiRouter.delete('/store/profile/:id', (req, res) => {
  const { id } = req.params
  let message

  if (profilesSel().current === id) {
    message = `deleting current profile ${id}`
    store.dispatch(
      setCurrentProfileId(null),
      deleteProfile(id),
      breakRouterCache()
    )
  } else {
    message = `deleting profile ${id}`
    store.dispatch(
      deleteProfile(id)
    )
  }

  serverLog(message)
  res.send({ status: 'success', message })
})

/**
 * getAllProfiles
 *
 * @method GET
 * @path /veggie/api/v1/store/profile
 */
apiRouter.get('/store/profile', (req, res) => {
  const data = profilesSel()
  res.send({ status: 'success', data })
})

/**
 * saveProfile
 *
 * Save the current overrides to disk as a new profile
 *
 * @method POST
 * @path /veggie/api/v1/store/profile
 * @body {string} name
 */
apiRouter.post('/store/profile', (req, res) => {
  const { name } = req.body

  if (name) {
    store.dispatch(
      setStateAsProfile(name)
    )

    const message = `saving ${name} profile`
    serverLog(message)

    res.send({ status: 'success', message })
  } else {
    const error = 'save requires a name'
    serverError(error)

    res.status(400).send({ status: 'failed', error })
  }
})

/**
 * loadProfile
 *
 * Load a previously saved profile from disk
 *
 * @method PUT
 * @path /veggie/api/v1/store/profile
 */
apiRouter.put('/store/profile', (req, res) => {
  const { id } = req.body
  const profile = profileByIdSel(id)

  if (id) {
    store.dispatch(
      setCurrentProfileId(id),
      breakRouterCache()
    )

    const message = `loading ${profile.name} profile`
    serverLog(message)

    res.send({ status: 'success', message })
  } else {
    const error = `could not find profile with id ${id}`
    serverError(error)

    res.status(400).send({ status: 'failed', error })
  }
})

/**
 * resetProfile
 *
 * Reset all services to their initial configuration
 *
 * @method DELETE
 * @path /veggie/api/v1/store/profile
 */
apiRouter.delete('/store/profile', (req, res) => {
  const message = 'reseting on to all service defaults'
  serverLog(message)

  store.dispatch(
    setCurrentProfileId(null),
    breakRouterCache()
  )

  res.send({ status: 'success', message })
})

/**
 * getAllServices
 *
 * Show all service overrides and their override payload
 *
 * @method GET
 * @path /veggie/api/v1/store
 */
apiRouter.get('/store', (req, res) => {
  const data = servicesSel()
  res.send({ status: 'success', data })
})

/**
 * newService
 *
 * @method POST
 * @path /veggie/api/v1/store
 */
apiRouter.post('/store', (req, res) => {
  store.dispatch(
    newServiceWithOverride(req.body),
    breakRouterCache()
  )

  const message = `creating new service ${req.body.url}`
  serverLog(message)
  res.send({ status: 'success', message })
})

/**
 * getService
 *
 * Get the configuration for an individual service
 *
 * @method GET
 * @path /veggie/api/v1/store/:id
 * @params id
 */
apiRouter.get('/store/:id', (req, res) => {
  const { id } = req.params
  const data = serviceByIdSel(id)
  res.send({ status: 'success', data })
})

/**
 * setService
 *
 * Set the status code and response for a given service
 *
 * @method POST
 * @path /veggie/api/v1/store/:id
 * @params id
 * @body {number} status
 * @body {object} response
 * @body {boolean} hang
 */
apiRouter.post('/store/:id', (req, res) => {
  const { id } = req.params
  const service = serviceByIdSel(id)

  if (service) {
    let override
    const hasOverrides = Object.keys(req.body).length > 0
    if (hasOverrides) {
      override = Object.assign(
        { status: 404, response: {}, hang: false },
        req.body
      )
    } else {
      override = null
    }

    store.dispatch(
      setOverride(service.id, override),
      breakRouterCache()
    )

    const message = `setting override on ${service.url.full} service with ${override && override.status} status`
    serverLog(message)
    res.send({ status: 'success', message })
  } else {
    const error = `could not find ${service.url} service to override`
    serverError(error)
    res.status(400).send({ status: 'failed', error })
  }
})
