const assert = require('assert')
const app = require('../../src/app')

describe("'publicKeys' service", () => {
  it('registered the service', () => {
    const service = app.service('public-keys')

    assert.ok(service, 'Registered the service')
  })
})
