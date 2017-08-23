// Initializes the `rtus` service on path `/rtus`
const createService = require('feathers-mongodb');
const hooks = require('./rtus.hooks');
const filters = require('./rtus.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/rtus', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('rtus');

  mongoClient.then(db => {
    service.Model = db.collection('rtus');
  });

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
