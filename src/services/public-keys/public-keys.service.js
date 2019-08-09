// Initializes the `publicKeys` service on path `/public-keys`
const createService = require('feathers-mongodb')
const hooks = require('./public-keys.hooks')
// !<DEFAULT> code: imports
// const $jsonSchema = require('./public-keys.mongo')
// !end
// !code: init // !end

const moduleExports = async function (app) {
  const db = await app.get('mongoClient')
  const Model = await db.collection('public-keys', {
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
  app.use('/public-keys', createService(options))
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('public-keys')

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
