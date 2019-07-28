// Application hooks that run for every service. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
// !code: imports
const log = require('./hooks/log')
const authorize = require('./hooks/authorize')
/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
// !end

// !<DEFAULT> code: used
// eslint-disable-next-line no-unused-vars
const { iff } = commonHooks
// !end
// !code: init // !end

const moduleExports = {
  before: {
    // !code: before
    all: [
      log(),
      // if accessToken is provided authenticate('jwt'), throws 401: NotAuthenticated
      iff(
        ({ params, path, app }) =>
          params.provider &&
          `/${path}` !== app.get('authentication').path &&
          Object.prototype.hasOwnProperty.call(params, 'authentication') &&
          params.authentication,
        authenticate('jwt')
      ),
      // authorize() grants permissions accordingly for anonymous and authenticated users, throws 403: Forbidden
      iff(({ params, path, app }) => {
        return params.provider && `/${path}` !== app.get('authentication').path
      }, authorize())
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  after: {
    // !<DEFAULT> code: after
    all: [log()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  error: {
    // !<DEFAULT> code: error
    all: [log()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
  }
  // !code: moduleExports // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
