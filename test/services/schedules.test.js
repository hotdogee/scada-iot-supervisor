const assert = require('assert')
const app = require('../../src/app')

describe("'schedules' service", () => {
  it('registered the service', () => {
    const service = app.service('schedules')

    assert.ok(service, 'Registered the service')
  })
})
