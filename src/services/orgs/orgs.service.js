// Initializes the `orgs` service on path `/orgs`
const createService = require('feathers-mongodb')
const hooks = require('./orgs.hooks')
// !<DEFAULT> code: imports
// const $jsonSchema = require('./orgs.mongo')
// !end
// !code: init // !end

const moduleExports = async function (app) {
  const db = await app.get('mongoClient')
  const Model = await db.createCollection('orgs', {
    // !<DEFAULT> code: create_collection
    // validator: { $jsonSchema: $jsonSchema },
    // validationLevel: 'strict', // The MongoDB default
    // validationAction: 'error', // The MongoDB default
    // !end
  })
  const paginate = app.get('paginate')
  // !<DEFAULT> code: func_init
  const options = { Model, paginate, whitelist: ['$client'], multi: false }
  // !end

  // Initialize our service with any options it requires
  // !<DEFAULT> code: extend
  app.use('/orgs', createService(options))
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('orgs')

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
