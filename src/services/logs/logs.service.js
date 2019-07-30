// Initializes the `logs` service on path `/logs`
const createService = require('feathers-mongodb')
const hooks = require('./logs.hooks')
// !<DEFAULT> code: imports
// const $jsonSchema = require('./logs.mongo')
// !end
// !code: init // !end

const moduleExports = function (app) {
  const paginate = app.get('paginate')
  const mongoClient = app.get('mongoClient')
  // !<DEFAULT> code: func_init
  const options = { paginate, whitelist: ['$client'], multi: false }
  // !end

  // Initialize our service with any options it requires
  // !<DEFAULT> code: extend
  app.use('/logs', createService(options))
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('logs')

  // eslint-disable-next-line no-unused-vars
  const promise = mongoClient
    .then((db) => {
      return db.createCollection('logs', {
        // !<DEFAULT> code: create_collection
        // validator: { $jsonSchema: $jsonSchema },
        // validationLevel: 'strict', // The MongoDB default
        // validationAction: 'error', // The MongoDB default
        // !end
      })
    })
    .then((serviceModel) => {
      service.Model = serviceModel
    })

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
