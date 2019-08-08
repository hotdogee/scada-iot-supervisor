// Hooks for service `templates`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !<DEFAULT> code: auth_imports
/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
/* eslint-enables no-unused-vars */
// !end
// !code: imports
/* eslint-disable no-unused-vars */
const { omit, sortBy } = require('lodash')
const { timestamp, assertDateOrSetNow } = require('../../hooks/common')
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
} = require('./templates.validate')
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
    find: [
      paramsFromClient('fallbackLanguage'),
      mongoKeys(ObjectID, foreignKeys)
    ],
    get: [],
    create: [timestamp('created'), timestamp('updated')],
    update: [timestamp('updated')],
    patch: [timestamp('updated')],
    remove: []
    // !end
  },

  after: {
    // !code: after
    all: [],
    find: [fallbackLanguage()],
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
const fixZh = {
  'zh-tw': 'zh-hant',
  'zh-hk': 'zh-hant',
  'zh-cn': 'zh-hans'
}
function fallbackLanguage (priority = ['en'], supported = ['en', 'zh-hant']) {
  return async (context) => {
    // check type === before, method === create
    checkContext(context, 'after', ['find'], 'fallbackLanguage')
    const {
      app,
      params,
      service,
      result: { total }
    } = context
    if (total > 0) return context
    const { fallbackLanguage, query } = params
    if (fallbackLanguage) {
      app.debug(`fallbackLanguage params =`, params)
      let language = query.language.toLowerCase()
      language = fixZh[language] || language
      const tokens = language.split(/[-_]/)
      const result = await service._find({
        query: omit(params.query, ['language'])
      })
      result.data = result.data.reduce((acc, template) => {
        // app.debug(`fallbackLanguage acc, template =`, { acc, template })
        let i = 0
        const t = template.language.split(/[-_]/)
        while (tokens[i] && t[i] && tokens[i] === t[i]) i++
        if (i > acc.length) acc[0] = template
        return acc
      }, [])
      result.total = result.data.length
      context.result = result
    }
    return context
  }
}
// !end
// !code: end // !end
