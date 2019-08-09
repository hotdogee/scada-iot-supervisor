// Hooks for service `apiKeys`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !<DEFAULT> code: auth_imports
/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
/* eslint-enables no-unused-vars */
// !end
// !code: imports
/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken')
const merge = require('lodash.merge')
const { timestamp, assertDate } = require('../../hooks/common')
/* eslint-enables no-unused-vars */
// !end

// !<DEFAULT> code: used
/* eslint-disable no-unused-vars */
const {
  FeathersError,
  BadRequest,
  NotAuthenticated,
  PaymentError,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  NotAcceptable,
  Timeout,
  Conflict,
  LengthRequired,
  Unprocessable,
  TooManyRequests,
  GeneralError,
  NotImplemented,
  BadGateway,
  Unavailable
} = require('@feathersjs/errors')
const {
  iff,
  mongoKeys,
  keep,
  discard,
  disallow,
  isProvider,
  populate,
  alterItems,
  checkContext,
  paramsFromClient,
  paramsForServer
} = commonHooks
const {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch
} = require('./api-keys.validate')
/* eslint-enables no-unused-vars */
// !end
// !<DEFAULT> code: foreign_keys
// eslint-disable-next-line no-unused-vars
const foreignKeys = []
// !end
// !code: init // !end

const moduleExports = {
  before: {
    // Your hooks should include:
    //   all   : authenticate('jwt')
    //   find  : mongoKeys(ObjectID, foreignKeys)
    // !code: before
    all: [authenticate('jwt')],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [],
    create: [
      signApiKey(),
      timestamp('created'),
      timestamp('updated'),
      validateCreate()
    ],
    update: [timestamp('updated')],
    patch: [timestamp('updated')],
    remove: []
    // !end
  },

  after: {
    // !<DEFAULT> code: after
    all: [],
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
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
    // !<DEFAULT> code: moduleExports
  }
  // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs
function signApiKey (audience = 'api-key', expiresIn = '10y') {
  return async (context) => {
    // check type === before, method === 'patch'
    checkContext(context, 'before', ['create'], 'signApiKey')
    const { app, service, subject, data, params, id: albumId } = context
    const { userId } = data
    // sign jwt
    const payload = {}
    const { secret, jwtOptions } = app.get('authentication')
    const options = merge({}, jwtOptions, {
      audience,
      subject: userId,
      expiresIn
    })
    // app.debug('jwt.sign', payload, options)
    data._id = jwt.sign(payload, secret, options)
    return context
  }
}
// !end
// !code: end // !end
