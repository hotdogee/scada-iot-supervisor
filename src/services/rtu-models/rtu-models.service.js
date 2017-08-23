// Initializes the `rtu_models` service on path `/rtu-models`
const createService = require('feathers-mongodb');
const hooks = require('./rtu-models.hooks');
const filters = require('./rtu-models.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/rtu-models', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('rtu-models');

  mongoClient.then(db => {
    service.Model = db.collection('rtu-models');
  });

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
