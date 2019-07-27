// Hooks for service `users`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { authenticate } = require('@feathersjs/authentication').hooks
const { ObjectID } = require('mongodb')
// !code: imports
// const safeStringify = require('fast-safe-stringify')
const commonPassword = require('common-password')
const path = require('path')
const debug = require('debug')(
  `scada:${path.basename(__filename, path.extname(__filename))}`
)
const { restrictToOwner } = require('feathers-authentication-hooks')
const {
  hashPassword,
  protect
} = require('@feathersjs/authentication-local').hooks
const { timestamp } = require('../../hooks/common')
const { verifyRecaptcha } = require('../../hooks/recaptcha')
const { verifyECDSA, savePublicKey } = require('../../hooks/ecdsa')
const {
  /* eslint-disable no-unused-vars */
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
  /* eslint-enable no-unused-vars */
} = require('@feathersjs/errors')
const {
  /* eslint-disable no-unused-vars */
  alterItems,
  when,
  discard,
  disallow,
  isProvider,
  keep,
  populate,
  skipRemainingHooks
  /* eslint-enable no-unused-vars */
} = commonHooks
// !end

// !code: used
// eslint-disable-next-line no-unused-vars
const { iff, mongoKeys } = commonHooks
/* eslint-disable no-unused-vars */
const {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch
} = require('./users.validate') /* eslint-enable no-unused-vars */
// !end
// !<DEFAULT> code: foreign_keys
// eslint-disable-next-line no-unused-vars
const foreignKeys = ['_id', 'avatar']
// !end
// !code: init
const restrict = [
  authenticate('jwt'),
  restrictToOwner({
    idField: '_id',
    ownerField: '_id'
  })
]
// !end

const moduleExports = {
  before: {
    // Your hooks should include:
    //   find  : authenticate('jwt'), mongoKeys(ObjectID, foreignKeys)
    //   get   : authenticate('jwt')
    //   update: authenticate('jwt')
    //   patch : authenticate('jwt')
    //   remove: authenticate('jwt')
    // !code: before
    all: [],
    find: [authenticate('jwt'), mongoKeys(ObjectID, foreignKeys)],
    get: [authenticate('jwt')],
    create: [
      // validateSchema(createUserSchema, ajv),
      rejectCommonPassword(),
      verifyRecaptcha(),
      verifyECDSA(),
      unique('accounts.value'),
      hashPassword('password'),
      // iff(
      //   isProvider('external'),
      //   keep(...Object.keys(createUserSchema.properties))
      // ),
      alterItems((user) => {
        user.accountSelected = 0
        user.authorizationSelected = ''
      }),
      timestamp('created'),
      timestamp('updated')
    ],
    update: [
      ...restrict,
      disallow('external'),
      // validateSchema(createUserSchema, ajv),
      rejectCommonPassword(),
      verifyECDSA(),
      unique('accounts.value'),
      hashPassword('password'),
      timestamp('updated')
    ],
    patch: [
      timestamp('updated'),
      // validateSchema(patchUserSchema, ajv),
      unique('accounts.value'),
      rejectCommonPassword(),
      hashPassword('password'),
      iff(isProvider('external'), ...restrict, verifyECDSA())
      // iff(
      //   isProvider('external'),
      //   keep(...Object.keys(patchUserSchema.properties))
      // )
    ],
    remove: [authenticate('jwt'), disallow('external')]
    // !end
  },

  after: {
    // !code: after
    all: [
      when(
        (hook) => hook.params.provider, // Will be undefined for internal calls from the server
        protect('password') /* Must always be the last hook */
      ),
      populate({
        schema: {
          include: {
            service: 'user-authorizations',
            nameAs: 'authorizations',
            parentField: '_id',
            childField: 'userId',
            asArray: true,
            query: {
              $select: ['scope', 'created', 'updated'],
              $sort: { updated: -1 }
            }
          }
        }
      })
    ],
    find: [],
    get: [],
    create: [savePublicKey(), createEmailVerification(), addTestAuth()],
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
function rejectCommonPassword (
  fieldName = 'password',
  error = new BadRequest({
    message: `Password is too easy to guess`,
    errors: {
      [fieldName]: `Password is too easy to guess`
    }
  })
) {
  return (context) => {
    if (!context.data[fieldName]) return context
    if (commonPassword(context.data[fieldName])) {
      debug('Password is too easy to guess')
      throw error
    }
    return context
  }
}

function unique (
  fieldName,
  error = new BadRequest({
    message: `${fieldName} exists`,
    errors: {
      [fieldName]: `${fieldName} exists`
    }
  })
) {
  return async (context) => {
    if (!context.data.accounts) return context
    // check if fieldName value exists in db
    const params = {
      query: {
        [fieldName]: context.data.accounts[0].value,
        $limit: 0
      }
    }
    if (context.id) {
      params.query._id = { $ne: context.id }
    }
    const result = await context.service.find(params)
    if (result.total > 0) {
      throw error
    }
    return context
  }
}

function createEmailVerification () {
  return async (context) => {
    try {
      if (
        !context.result.accounts ||
        context.result.accounts[0].type !== 'email'
      ) {
        return context
      }
      const data = {
        userId: context.result._id,
        email: context.result.accounts[0].value,
        locale: context.result.locale
      }
      debug(`context.app.service('email-verifications').create`, data)
      context.app.service('email-verifications').create(data)
      return context
    } catch (error) {
      debug(error)
      throw error
    }
  }
}

function addTestAuth () {
  return async (context) => {
    try {
      // context.app.service('user-authorizations').create({
      //   userId: context.result._id,
      //   scope: {
      //     role: 'patient',
      //     org: 'mmh',
      //     patientId: 14958
      //   }
      // })
      // context.app.service('user-authorizations').create({
      //   userId: context.result._id,
      //   scope: {
      //     role: 'embryologist',
      //     org: 'mmh'
      //   }
      // })
      return context
    } catch (error) {
      debug(error)
      throw error
    }
  }
}

// function getAuthorizations () {
//   return async (context) => {
//     let { result, id } = context
//     result.authorizations = []
//     try {
//       const query = {
//         query: {
//           userId: id,
//           $limit: 1000
//         }
//       }
//       let auths = await context.app.service('user-authorizations').find(query)
//       context.app.debug(
//         `context.app.service('user-authorizations').find ${safeStringify(
//           auths
//         )}`
//       )
//       if (auths.total > 0) {
//         auths.data.forEach((auth) => {
//           result.authorizations.push(auth.authorization)
//         })
//       }
//       context.app.debug(
//         `getAuthorizations context.result ${safeStringify(result)}`
//       )
//       return context
//     } catch (error) {
//       debug(error)
//       throw error
//     }
//   }
// }
// !end
// !code: end // !end

// TODO: handle google oauth
// @feathersjs/authentication-oauth2:verify Creating new user with googleId: 108576876073520472460 +18ms
// {
//   type: 'before',
//   method: 'create',
//   path: 'users',
//   params: { oauth: { provider: 'google' } },
//   data: {
//     googleId: '108576876073520472460',
//     google: {
//       profile: [Object],
//       accessToken: 'ya29.GlsqBwc_j_B90H1OlHgUyeRpPB2rXK7hzmTtA5CRGq7tsT8IGQDjbgHGEeq0mk-9VwxvfLmE9ygCMqp6s6zZA2gKuaMoAi697SU7V_D0uG-7H107Illw1HvHXDqK'
//     }
//   }
// }

// TODO: handle facebook oauth
// @feathersjs/authentication-oauth2:verify Creating new user with googleId: 108576876073520472460 +18ms
// {
//   "type": "before",
//   "method": "create",
//   "path": "users",
//   "params": {
//     "oauth": {
//       "provider": "google"
//     }
//   },
//   "data": {
//     "googleId": "108576876073520472460",
//     "google": {
//       "profile": {
//         "id": "108576876073520472460",
//         "displayName": "Han Lin",
//         "name": {
//           "familyName": "Lin",
//           "givenName": "Han"
//         },
//         "emails": [
//           {
//             "value": "hotdogee@gmail.com",
//             "verified": true
//           }
//         ],
//         "photos": [
//           {
//             "value": "https://lh6.googleusercontent.com/-Gz9NEs3yqRo/AAAAAAAAAAI/AAAAAAABR-g/irmjLqHJlKU/photo.jpg"
//           }
//         ],
//         "provider": "google",
//         "_raw": "{\n  \"sub\": \"108576876073520472460\",\n  \"name\": \"Han Lin\",\n  \"given_name\": \"Han\",\n  \"family_name\": \"Lin\",\n  \"picture\": \"https://lh6.googleusercontent.com/-Gz9NEs3yqRo/AAAAAAAAAAI/AAAAAAABR-g/irmjLqHJlKU/photo.jpg\",\n  \"email\": \"hotdogee@gmail.com\",\n  \"email_verified\": true,\n  \"locale\": \"zh-TW\"\n}",
//         "_json": {
//           "sub": "108576876073520472460",
//           "name": "Han Lin",
//           "given_name": "Han",
//           "family_name": "Lin",
//           "picture": "https://lh6.googleusercontent.com/-Gz9NEs3yqRo/AAAAAAAAAAI/AAAAAAABR-g/irmjLqHJlKU/photo.jpg",
//           "email": "hotdogee@gmail.com",
//           "email_verified": true,
//           "locale": "zh-TW"
//         }
//       },
//       "accessToken": "ya29.GlwrB8Iwc4vXk1Fegdb9rwQr8foLCwr6xXwKQOAwnNjgcVKZrpv-RQeg5pY4ZtKXPlaulJh317rkiZ7pZ0vMtm880kn1Nnsyv17e4BgLiuyOYoKSS96Uy3dOqQV-JA"
//     }
//   },
//   "level": "debug",
//   "message": "---HOOK---",
//   "timestamp": "2019-06-18T10:38:14.669Z",
//   "ms": "+3ms",
//   "hostname": "36a5065d9991",
//   "@timestamp": "2019-06-18T10:38:14.669000000+00:00",
//   "log_name": "infans-api"
// }

// @feathersjs/authentication-oauth2:verify Creating new user with facebookId: 10214073228046994 +13ms
// {
//   "type": "before",
//   "method": "create",
//   "path": "users",
//   "params": {
//     "oauth": {
//       "provider": "facebook"
//     }
//   },
//   "data": {
//     "facebookId": "10214073228046994",
//     "facebook": {
//       "profile": {
//         "id": "10214073228046994",
//         "displayName": "Han Lin",
//         "name": {
//           "familyName": "Lin",
//           "givenName": "Han"
//         },
//         "emails": [
//           {
//             "value": "hotdogee@gmail.com"
//           }
//         ],
//         "photos": [
//           {
//             "value": "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10214073228046994&height=50&width=50&ext=1563446902&hash=AeRqmPeTEMdD9nGV"
//           }
//         ],
//         "provider": "facebook",
//         "_raw": "{\"id\":\"10214073228046994\",\"name\":\"Han Lin\",\"first_name\":\"Han\",\"last_name\":\"Lin\",\"email\":\"hotdogee\\u0040gmail.com\",\"picture\":{\"data\":{\"height\":50,\"is_silhouette\":false,\"url\":\"https:\\/\\/platform-lookaside.fbsbx.com\\/platform\\/profilepic\\/?asid=10214073228046994&height=50&width=50&ext=1563446902&hash=AeRqmPeTEMdD9nGV\",\"width\":50}},\"permissions\":{\"data\":[{\"permission\":\"email\",\"status\":\"granted\"},{\"permission\":\"public_profile\",\"status\":\"granted\"}]}}",
//         "_json": {
//           "id": "10214073228046994",
//           "name": "Han Lin",
//           "first_name": "Han",
//           "last_name": "Lin",
//           "email": "hotdogee@gmail.com",
//           "picture": {
//             "data": {
//               "height": 50,
//               "is_silhouette": false,
//               "url": "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10214073228046994&height=50&width=50&ext=1563446902&hash=AeRqmPeTEMdD9nGV",
//               "width": 50
//             }
//           },
//           "permissions": {
//             "data": [
//               {
//                 "permission": "email",
//                 "status": "granted"
//               },
//               {
//                 "permission": "public_profile",
//                 "status": "granted"
//               }
//             ]
//           }
//         }
//       },
//       "accessToken": "EAAGh34U3tO0BANT8LbjQsYfmZAs1iYmKMuMtfogWcrph3ZCtzeZC2ZCfcf8fnZAXAe3hU9xoZALmYF16d8KKMjx0st67vZBCJVm6ic3ZAwgV8INvGP0pP0UPN15HhZBmEXlU6ZCGQdWmrBgpkh30KIuzLojJRPap6WOvZCbeNx4cmI5cyc5LW0AdAMU"
//     }
//   },
//   "level": "debug",
//   "message": "---HOOK---",
//   "timestamp": "2019-06-18T10:48:22.190Z",
//   "ms": "+4ms",
//   "hostname": "36a5065d9991",
//   "@timestamp": "2019-06-18T10:48:22.190000000+00:00",
//   "log_name": "infans-api"
// }
