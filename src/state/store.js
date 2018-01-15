let state = {
  id: null,
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

export default {
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
