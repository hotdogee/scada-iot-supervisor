// Hooks for service `albums`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !code: auth_imports
// const { authenticate } = require('@feathersjs/authentication').hooks
// !end
// !code: imports
/* eslint-disable no-unused-vars */
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
} = require('./albums.validate')
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
    all: [
      // authenticate('jwt')
    ],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [],
    create: [timestamp('created'), timestamp('updated')],
    update: [timestamp('updated')],
    patch: [
      // paramsFromClient('image'),
      // patchImages(),
      timestamp('updated')
    ],
    remove: []
    // !end
  },

  after: {
    // !code: after
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
function patchImages () {
  // add image to album
  return async (context) => {
    // check type === before, method === 'patch'
    checkContext(context, 'before', ['patch'], 'patchImages')
    const { app, service, subject, data, params, id: albumId } = context
    const { image } = params
    const { keep } = subject
    // app.info(`patchImages image`, image)
    // app.info(`patchImages subject`, subject)
    if (!image) return context
    data.$push = {
      images: {
        $each: [image],
        $sort: { created: -1 }
      }
    }
    if (keep) {
      data.$push.images.$slice = keep
    }
    return context
  }
}
// !end
// !code: end // !end
