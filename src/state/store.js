const defaultState = {
  id: null,
  delay: 1000,
  log: true,
  services: {
    ids: [],
    byId: {}
  },
  profiles: {
    dir: null,
    current: null,
    ids: [],
    byId: {},
    data: {}
  }
}

let state = defaultState

export default {
  clear () {
    state = defaultState
  },
  dispatch (reducer) {
    let newState = reducer(Object.assign({}, state))

    if (!newState) {
      throw new Error('state needs to be returned from reducer')
    }

    state = newState
  },
  getState () {
    return state
  }
}
