const assert = require('assert');
const app = require('../../src/app');

describe('\'plcs\' service', () => {
  it('registered the service', () => {
    const service = app.service('plcs');

    assert.ok(service, 'Registered the service');
  });
});
