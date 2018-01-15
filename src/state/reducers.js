export function overrideService (service, override = null) {
  service.override = override
  return service
}

// Set directory for saving/loading profiles
export function setProfileDir (dir) {
  if (dir) {
    // Make profile dir absolute
    if (!path.isAbsolute(dir)) {
      dir = path.join(process.cwd(), dir)
    }

    store.dispatch(state => {
      state.profile.dir = dir
      return state
    })
  }
}

export function loadProfile (profile) {
  if (profile) {
    store.dispatch(state => {
      state = loadProfile(state, profile)
      return state
    })
  }
}
