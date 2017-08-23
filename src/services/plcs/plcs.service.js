// Initializes the `plcs` service on path `/plcs`
const createService = require('feathers-mongodb');
const hooks = require('./plcs.hooks');
const filters = require('./plcs.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/plcs', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('plcs');

  mongoClient.then(db => {
    service.Model = db.collection('plcs');
  });

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
