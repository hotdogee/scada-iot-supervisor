// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// const { omit } = require('lodash')
const safeStringify = require('fast-safe-stringify')
const { checkContext } = require('feathers-hooks-common')
const { AbilityBuilder, Ability } = require('@casl/ability')
const { toMongoQuery } = require('@casl/mongoose')
const { Forbidden } = require('@feathersjs/errors')
const TYPE_KEY = Symbol.for('type')
/* eslint-disable no-unused-vars */
const path = require('path')
const debug = require('debug')(
  `infans-api:${path.basename(__filename, path.extname(__filename))}`
)
/* eslint-enable no-unused-vars */

Ability.addAlias('read', ['get', 'find'])
Ability.addAlias('write', ['create', 'remove', 'update', 'patch'])

function defineAbilitiesFor (params, data) {
  // eslint-disable-next-line no-unused-vars
  const { rules, can, cannot } = AbilityBuilder.extract()
  const { user, authentication = {} } = params
  const { payload = {} } = authentication || {}
  // const payload = {
  //   iat: 1561828929,
  //   exp: 1561830729,
  //   aud: 'api',
  //   iss: 'infans.io',
  //   sub: '5d166b06ada0c3004e2f2319',
  //   jti: '90164fab-f2ac-4b27-b4d4-781b87f5f175'
  // }
  can(['get', 'find', 'create', 'patch'], ['logs'])
  can(['get', 'find', 'create', 'patch'], ['blob'])
  can(['get', 'find', 'create', 'patch'], ['images'])
  can(['get', 'find', 'create', 'patch'], ['albums'])
  can('create', ['users', 'authentication', 'password-resets']) // , 'email-verifications', 'public-keys', 'emails'
  can('read', ['api-servers'])
  can('patch', ['email-verifications'])
  // token can only be used once
  can('patch', ['password-resets'], { token: { $exists: false } })
  // can('patch', 'email-verifications', { token: { $exists: false } })

  if (user) {
    can(['find', 'get', 'create', 'remove'], ['api-keys'], {
      userId: user._id
    })
    if (payload.aud === 'public-keys') {
      can('create', ['public-keys'], {
        userId: user._id
      })
    }
    can('create', ['email-verifications'], {
      userId: user._id
    })
    can(['get', 'update', 'patch'], 'users', { _id: user._id })
    can(['find'], 'user-authorizations') // todo: auth should limited to admin
    can(['find'], 'notification-subscriptions') // todo: auth should limited to admin
    can(['get', 'create', 'patch', 'remove'], ['notification-subscriptions'], {
      userId: user._id
    })
    can(['create', 'patch', 'find'], ['notifications'])
    cannot(
      ['update', 'patch'],
      'users',
      [
        '_id',
        'accounts.verificationId',
        'authorizations',
        'created',
        'updated'
      ],
      { _id: user._id }
    )
    can('create', 'authorization-applications')
    can(['update', 'patch', 'get', 'find'], 'authorization-applications', {
      userId: user._id
    })
    can('manage', 'user-authorizations') // for test
    can('manage', 'authorization-applications') // for test
    can('manage', 'orgs') // for test
    can('manage', 'roles') // for test
    if (Array.isArray(user.authorizations) && user.authorizationSelected) {
      // const authorization = user.authorizations[user.authorizationSelected]
      // if (authorization.org === 'binflux' && authorization.role === 'admin') {
      //   can('manage', 'all')
      // }
      // if (authorization.org === 'MMH' && authorization.role === 'consultant') {
      //   can(['create', 'remove', 'update', 'patch', 'get', 'find'], 'user-authorizations')
      //   can(['update', 'patch', 'get', 'find'], 'authorization-applications')
      // }
    }
  }

  return new Ability(rules, {
    subjectName (subject) {
      return !subject || typeof subject === 'string'
        ? subject
        : subject[TYPE_KEY]
    }
  })
}

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  // Return the actual hook.
  return async (context) => {
    // Throw if the hook is being called from an unexpected location.
    checkContext(context, 'before', null, 'authorize')

    const { method, service, path, params, data, id } = context
    // context.app.debug(`data in authorize`, context.toJSON())
    const ability = defineAbilitiesFor(params, data)
    const throwUnlessCan = (method, subject) => {
      if (ability.cannot(method, subject)) {
        throw new Forbidden(
          `You are not allowed to ${method} ${path}. ${safeStringify(
            params.user
          )} - ${safeStringify(params.authentication)}`
        )
      }
    }

    params.ability = ability

    if (method === 'create') {
      data[TYPE_KEY] = path
      throwUnlessCan('create', data)
    }

    if (!id) {
      const query = toMongoQuery(ability, path, method)
      // debug('toMongoQuery = ', query, ability, path, method)
      if (query !== null) {
        // context.app.debug({
        //   message: `params.query: ${safeStringify(
        //     params.query
        //   )},  query: ${safeStringify(query)}`,
        //   context: context.toJSON()
        // })
        Object.assign(params.query || {}, query || {})
      } else {
        // The only issue with this is that user will see total amount of records in db
        // for the resources which he shouldn't know.
        // Alternative solution is to assign `__nonExistingField` property to query
        // but then feathers-mongoose will send a query to MongoDB which for sure will return empty result
        // and may be quite slow for big datasets
        params.query.$limit = 0
      }

      return context
    } else {
      // has id: get, update, patch, remove
      const p = Object.assign({}, params, { provider: null })
      p.query = Object.assign({}, p.query)
      delete p.query.$client
      const subject = await service._get(id, p)

      subject[TYPE_KEY] = path
      throwUnlessCan(method, subject)

      if (method === 'get') {
        context.result = subject
      } else {
        context.subject = subject
      }

      return context
    }
  }
}
