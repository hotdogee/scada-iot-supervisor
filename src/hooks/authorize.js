// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// const { omit } = require('lodash')
/* eslint-disable no-unused-vars */
const safeStringify = require('fast-safe-stringify')
const { checkContext } = require('feathers-hooks-common')
const { AbilityBuilder, Ability } = require('@casl/ability')
const { toMongoQuery } = require('@casl/mongoose')
const { Forbidden } = require('@feathersjs/errors')
const TYPE_KEY = Symbol.for('type')
const path = require('path')
const debug = require('debug')(
  `scada:${path.basename(__filename, path.extname(__filename))}`
)
/* eslint-enable no-unused-vars */

Ability.addAlias('read', ['get', 'find'])
Ability.addAlias('write', ['create', 'remove', 'update', 'patch'])

function defineAbilitiesFor (params, data) {
  const { rules, can, cannot } = AbilityBuilder.extract()
  // const { user, authentication = {} } = params
  const { user } = params
  // const { payload = {} } = authentication || {}
  // const payload = {
  //   iat: 1561828929,
  //   exp: 1561830729,
  //   aud: 'api',
  //   iss: 'hanl.in',
  //   sub: '5d166b06ada0c3004e2f2319',
  //   jti: '90164fab-f2ac-4b27-b4d4-781b87f5f175'
  // }
  can(['get', 'find'], ['logs', 'blob', 'images', 'albums'])
  can('create', ['users']) // , 'email-verifications', 'public-keys', 'emails'
  // can('read', ['api-servers'])
  // can('patch', ['email-verifications'])
  // token can only be used once
  // can('patch', ['password-resets'], { token: { $exists: false } })
  // can('patch', 'email-verifications', { token: { $exists: false } })

  if (user) {
    can(['find', 'get', 'create', 'remove'], ['api-keys'], {
      userId: user._id
    })
    can(['get', 'patch'], 'users', { _id: user._id })
    cannot(
      ['patch'],
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
    if (Array.isArray(user.authorizations)) {
      // if role === 'admin
      if (
        user.authorizations.some(
          (a) => a.org === 'hanl.in' && a.role === 'admin'
        )
      ) {
        can(['create'], ['logs', 'blob', 'images', 'albums'])
        can(['find', 'create'], ['templates'])
        can(['remove'], ['images'])
        can(['patch'], ['albums'])
        can(['find'], ['users'])
        // can(['get', 'create', 'patch', 'remove'], ['notification-subscriptions'], {
        //   userId: user._id
        // })
        // can(['create', 'patch', 'find'], ['notifications'])
        // can('create', 'authorization-applications')
        // can(['update', 'patch', 'get', 'find'], 'authorization-applications', {
        //   userId: user._id
        // })
        // can('manage', 'user-authorizations') // for test
        // can('manage', 'authorization-applications') // for test
        // can('manage', 'orgs') // for test
        // can('manage', 'roles') // for test
      }
      // const authorization = user.authorizations[user.authorizationSelected]
      // if (authorization.org === 'hanl.in' && authorization.role === 'admin') {
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
// const anonymousContext = {
//   params: {
//     query: {
//       $client: {
//         token:
//           'eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjYxNDM0NTMsImV4cCI6MTU2NjE0NTI1MywiYXVkIjoiYW5keW1ldHplbkBnbWFpbC5jb20iLCJpc3MiOiJoYW5sLmluIiwic3ViIjoiNWQ1OTczZGQzOGFjMzQxZDE0OTlkMDRhIn0.XVcpUHxKWdzcA1x1vB24bzVo3K7MGpSFbnVOqf_sYCo'
//       }
//     },
//     route: {},
//     connection: {
//       provider: 'socketio',
//       headers: {
//         'user-agent': 'node-XMLHttpRequest',
//         accept: '*/*',
//         host: 'localhost:8086',
//         connection: 'close'
//       },
//       clientIp: '::ffff:127.0.0.1'
//     },
//     provider: 'socketio',
//     headers: {
//       'user-agent': 'node-XMLHttpRequest',
//       accept: '*/*',
//       host: 'localhost:8086',
//       connection: 'close'
//     },
//     clientIp: '::ffff:127.0.0.1'
//   },
//   id: null,
//   data: {}
// }
// const userContext = {
//   params: {
//     query: {
//       $client: {
//         token:
//           'eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjYxNDM0NTMsImV4cCI6MTU2NjE0NTI1MywiYXVkIjoiYW5keW1ldHplbkBnbWFpbC5jb20iLCJpc3MiOiJoYW5sLmluIiwic3ViIjoiNWQ1OTczZGQzOGFjMzQxZDE0OTlkMDRhIn0.XVcpUHxKWdzcA1x1vB24bzVo3K7MGpSFbnVOqf_sYCo'
//       }
//     },
//     route: {},
//     connection: {
//       provider: 'socketio',
//       headers: {
//         'user-agent': 'node-XMLHttpRequest',
//         accept: '*/*',
//         host: 'localhost:8086',
//         connection: 'close'
//       },
//       clientIp: '::ffff:127.0.0.1',
//       authentication: {
//         strategy: 'jwt',
//         accessToken:
//           'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjYxNDU5MzAsImV4cCI6MTU2NjE0NjUzMCwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNTk3M2RkMzhhYzM0MWQxNDk5ZDA0YSIsImp0aSI6IjhhY2M3MzViLTM4YmMtNDYzZi05NDhiLTJjMzdmZGUzNTNmNyJ9.sY2H1CYCECfJvRZodN4dB5Sh1NX0JlJLAtWU4vqNHxc'
//       },
//       user: {
//         _id: '5d5973dd38ac341d1499d04a',
//         accounts: [
//           {
//             type: 'email',
//             value: 'andymetzen@gmail.com',
//             verified: '2019-08-18T16:18:12.950Z'
//           }
//         ],
//         language: 'en',
//         country: 'tw',
//         created: '2019-08-18T15:50:53.389Z',
//         updated: '2019-08-18T16:18:12.952Z'
//       }
//     },
//     provider: 'socketio',
//     headers: {
//       'user-agent': 'node-XMLHttpRequest',
//       accept: '*/*',
//       host: 'localhost:8086',
//       connection: 'close'
//     },
//     clientIp: '::ffff:127.0.0.1',
//     authentication: {
//       strategy: 'jwt',
//       accessToken:
//         'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjYxNDU5MzAsImV4cCI6MTU2NjE0NjUzMCwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNTk3M2RkMzhhYzM0MWQxNDk5ZDA0YSIsImp0aSI6IjhhY2M3MzViLTM4YmMtNDYzZi05NDhiLTJjMzdmZGUzNTNmNyJ9.sY2H1CYCECfJvRZodN4dB5Sh1NX0JlJLAtWU4vqNHxc'
//     },
//     user: {
//       _id: '5d5973dd38ac341d1499d04a',
//       accounts: [
//         {
//           type: 'email',
//           value: 'andymetzen@gmail.com',
//           verified: '2019-08-18T16:18:12.950Z'
//         }
//       ],
//       language: 'en',
//       country: 'tw',
//       created: '2019-08-18T15:50:53.389Z',
//       updated: '2019-08-18T16:18:12.952Z'
//     }
//   },
//   id: null,
//   data: {}
// }

module.exports = function (options = {}) {
  // Return the actual hook.
  return async (context) => {
    // Throw if the hook is being called from an unexpected location.
    checkContext(context, 'before', null, 'authorize')

    const { method, service, path, params, data, id } = context
    // context.app.debug(`data in authorize`, context.toJSON())
    const clientIp = params.clientIp || params.restAddress
    const provider = params.provider ? params.provider : 'server'
    const user = params.user ? params.user._id : 'anonymous'
    const strategy = params.authentication
      ? params.authentication.strategy
      : 'null'
    const ability = defineAbilitiesFor(params, data)
    const throwUnlessCan = (method, subject) => {
      if (ability.cannot(method, subject)) {
        throw new Forbidden(
          `${provider} - ${clientIp} - ${user} - ${strategy} is not allowed to ${method} ${path}.`
          // + `\ndata = ${safeStringify(subject)}`
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
      // app.debug('toMongoQuery = ', { query, ability, path, method })
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
