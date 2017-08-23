const assert = require('assert');
const app = require('../../src/app');

describe('\'rtus\' service', () => {
  it('registered the service', () => {
    const service = app.service('rtus');

    assert.ok(service, 'Registered the service');
  });
});
