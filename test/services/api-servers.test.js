const assert = require('assert')
const app = require('../../src/app')

describe("'apiServers' service", () => {
  it('registered the service', () => {
    const service = app.service('api-servers')

    assert.ok(service, 'Registered the service')
  })
})
