// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'

describe('images service', () => {
  it('registered the service', () => {
    const service = app.service('images')

    assert.ok(service, 'Registered the service')
  })
})
