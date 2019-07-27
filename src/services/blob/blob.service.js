// Initializes the `blob` service on path `/blob`. (Can be re-generated.)
// !<DEFAULT> code: createService
const createService = require('./blob.class')
// !end
const hooks = require('./blob.hooks')
// !code: imports // !end
// !code: init // !end

const moduleExports = function (app) {
  const paginate = app.get('paginate')
  // !code: func_init // !end

  const options = {
    // !code: options_more // !end
    paginate
  }
  // !code: options_change // !end

  // Initialize our service with any options it requires
  // !<DEFAULT> code: extend
  app.use('/blob', createService(options))
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('blob')

  service.hooks(hooks)
  // !code: func_return // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
