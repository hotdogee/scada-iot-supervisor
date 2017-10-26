// Initializes the `logs` service on path `/logs`
const createService = require('feathers-mongodb')
const hooks = require('./logs.hooks')
const filters = require('./logs.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')
  const mongoClient = app.get('mongoClient')
  const options = { paginate }

  // Initialize our service with any options it requires
  app.use('/logs', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('logs')

  mongoClient.then(db => {
    service.db = db
    service.Model = db.collection('logs')
  })

  service.hooks(hooks)

  //service.filter(filters)
  service.filter(filters)
}
