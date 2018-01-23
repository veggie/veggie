import fs from 'fs'
import uuid from 'uuid'
import path from 'path'
import { formatService, servicesFromDir } from '../utils'
import { currentOverridesSel, profileDirSel, profileByIdSel, profilesSel } from './selectors'

/**
 * Marks a service as okay to delete
 */
const TEMPORARY = 'temporary'

function fileWithJsonExt (name) {
  // Add json extension
  if (!name.includes('.json')) {
    name = `${name}.json`
  }

  return name
}

function loadProfileFromFs (profile) {
  const fileData = fs.readFileSync(profile.requirePath)
  const profileData = JSON.parse(fileData)

  return profileData
}

export function deleteProfile (id) {
  return state => {
    const profile = profileByIdSel(id)
    const { current } = profilesSel()

    fs.unlinkSync(profile.requirePath)

    state.profiles.ids = state.profiles.ids.filter(profileId => profileId !== id)
    delete state.profiles.byId[id]
  }
}

export function getAvailableProfiles () {
  return state => {
    const { dir } = state.profiles

    if (!dir) {
      return
    } 

    try {
      fs.readdirSync(dir)
        .filter(file => /^[^.]/.test(file))
        .forEach(name => {
          const profile = createProfile(name)
          state.profiles.ids.push(profile.id)
          state.profiles.byId[profile.id] = profile
        })
    } catch (e) {
      profileError(`error reading profileDir ${dir} ${e}`)
    }
  }
}

function applyProfile (state, profile) {
  if (profile) {
    if (!profile.data) {
      profile.data = loadProfileFromFs(profile)
    }

    const profileUrls = Object.keys(profile.data)
    state.profiles.current = profile.id
    state.profiles.byId[profile.id].data = profile.data
    state.services = removeAllServiceOverrides(state.services)
    state.services.ids.forEach(id => {
      const { url } = state.services.byId[id]

      // TODO: This may need to be a more accurate matching algorithm
      if (profileUrls.includes(url.full)) {
        state.services.byId[id].override = profile.data[url.full]
      }
    })
  } else {
    state.profiles.current = null
    state.services = removeAllServiceOverrides(state.services)
  }
}

function removeAllServiceOverrides (services) {
  const newServices = Object.assign({}, services)

  newServices.ids.forEach(id => {
    if (newServices.byId[id].type === TEMPORARY) {
      delete newServices.byId[id]
    } else {
      newServices.byId[id].override = null
    }
  })

  const newIds = Object.keys(newServices.byId)
  newServices.ids = newServices.ids
    .filter(id => newIds.indexOf(id) !== -1)

  return newServices
}

export function setStateAsProfile (name) {
  return state => {
    if (!name) {
      return
    }

    const data = currentOverridesSel()
    const profile = createProfile(name)

    state.profiles.ids.push(profile.id)
    state.profiles.byId[profile.id] = Object.assign({}, profile, { data })
    state.profiles.current = profile.id

    fs.writeFileSync(profile.requirePath, JSON.stringify(data, null, 2))
  }
}

export function updateProfileWithState (id) {
  return state => {
    const data = currentOverridesSel()
    const profile = profileByIdSel(id)
    state.profiles.byId[profile.id].data = data

    fs.writeFileSync(profile.requirePath, JSON.stringify(data, null, 2))
  }
}

function createProfile (name) {
  const dir = profileDirSel()
  const id = uuid.v4()
  name = fileWithJsonExt(name)

  // Make path absolute
  let requirePath
  if (!path.isAbsolute(name)) {
    requirePath = path.join(dir, name)
  } else {
    requirePath = name
  }

  return { id, name, requirePath }
}

export function setCurrentProfileName (name) {
  return state => {
    if (!name) {
      return
    }

    name = fileWithJsonExt(name)
    const { byId, ids } = state.profiles
    const id = ids.find(id => name === byId[id].name)

    if (id) {
      applyProfile(state, byId[id])
    } else {
      applyProfile(state, null)
    }
  }
}

export function setCurrentProfileId (id) {
  return state => {
    if (id) {
      const profile = profileByIdSel(id)
      if (!profile) {
        return
      }

      applyProfile(state, profile)
    } else {
      applyProfile(state, null)
    }
  }
}

export function breakRouterCache () {
  // Break cache to force creating a new router
  return state => {
    state.id = uuid.v4()
  }
}

export function setSettings ({ log, profileDir, time }) {
  return state => {
    // Logging
    state.log = log

    // Time delay
    if (time !== null) {
      state.delay = time
    }

    // Profile dir
    state.profiles.dir = profileDir || process.cwd()
  }
}

export function setServices (dir) {
  return state => {
    for (let { url, config } of servicesFromDir(dir)) {
      const service = formatService(url, config)
      const { id } = service
      state.services.ids.push(id)
      state.services.byId[id] = service
    }
  }
}

export function setOverride (id, override) {
  return state => {
    state.services.byId[id].override = override
  }
}

export function newServiceWithOverride (payload) {
  return state => {
    const { url } = payload
    delete payload.url

    const service = formatService(url, {})
    const { id } = service
    service.type = TEMPORARY
    service.override = payload
    state.services.ids.push(id)
    state.services.byId[id] = service
  }
}
