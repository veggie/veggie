const assert = require('assert')
const express = require('express')
const serviceProfile = require('../dist/service-profile.js')

describe('service-profile', () => {
  it('returns routes', () => {
    assert(typeof serviceProfile.router({ dir: 'services/**/*.js' }), express.Router)
  })
  it('returns middleware', () => {
    assert(typeof serviceProfile.middleware({ dir: 'services/**/*.js' }), 'function')
  })
})
