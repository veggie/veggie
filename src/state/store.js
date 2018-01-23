let state

/**
 * Store
 */
export default {
  /**
   * Sets state to default
   */
  init () {
    state = {
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
        byId: {}
      }
    }
  },

  /**
   * Dispatch action-reducers
   *
   * 1. Copies current state
   * 2. Allows action-reducers to mutate the copy
   * 3. Overwrites current state with the new copy
   */
  dispatch (...reducers) {
    return reducers.forEach(reducer => {
      if (!(typeof reducer === 'function')) {
        throw new Error('dispatch must be passed a function')
      }

      let newState = Object.assign({}, state)
      reducer(newState)
      state = newState
    })
  },

  /**
   * Returns the current state
   */
  getState () {
    return state
  }
}
