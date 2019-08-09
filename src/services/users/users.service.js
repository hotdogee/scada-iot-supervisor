// Initializes the `users` service on path `/users`
const createService = require('feathers-mongodb')
const hooks = require('./users.hooks')
// !<DEFAULT> code: imports
// const $jsonSchema = require('./users.mongo')
// !end
// !code: init // !end

const moduleExports = async function (app) {
  const db = await app.get('mongoClient')
  // !<DEFAULT> code: collection
  const collection = await db.collection('users', {
    // validator: { $jsonSchema: $jsonSchema },
    // validationLevel: 'strict', // The MongoDB default
    // validationAction: 'error', // The MongoDB default
  })
  // !end
  const paginate = app.get('paginate')
  // !<DEFAULT> code: func_init
  const options = {
    Model: collection,
    paginate,
    whitelist: ['$client'],
    multi: false
  }
  // !end

  // Initialize our service with any options it requires
  // !<DEFAULT> code: extend
  app.use('/users', createService(options))
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('users')

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
