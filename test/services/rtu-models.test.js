const assert = require('assert');
const app = require('../../src/app');

describe('\'rtu_models\' service', () => {
  it('registered the service', () => {
    const service = app.service('rtu-models');

    assert.ok(service, 'Registered the service');
  });
});
