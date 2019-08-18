// Hooks for service `users`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !<DEFAULT> code: auth_imports
/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
// eslint-disable-next-line no-unused-vars
const {
  hashPassword,
  protect
} = require('@feathersjs/authentication-local').hooks
/* eslint-enables no-unused-vars */
// !end
// !code: imports
// const safeStringify = require('fast-safe-stringify')
const commonPassword = require('common-password')
const merge = require('lodash.merge')
const jwt = require('jsonwebtoken')
const path = require('path')
const debug = require('debug')(
  `scada:${path.basename(__filename, path.extname(__filename))}`
)
const { restrictToOwner } = require('feathers-authentication-hooks')
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
  skipRemainingHooks,
  paramsFromClient,
  checkContext
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
    //   create: hashPassword()
    //   update: hashPassword(), authenticate('jwt')
    //   patch : hashPassword(), authenticate('jwt')
    //   remove: authenticate('jwt')
    // !code: before
    all: [],
    find: [authenticate('jwt'), mongoKeys(ObjectID, foreignKeys)],
    get: [authenticate('jwt')],
    create: [
      // create local, create oauth, password-reset
      validateCreate(),
      paramsFromClient('recaptcha', 'signature', 'document', 'action'),
      // action = 'request-password-reset'
      // recaptcha required
      //
      // create-user
      // recaptcha required
      verifyRecaptcha(), // create-user, password-reset
      sendPasswordReset(),
      iff(
        (c) => !c.result,
        verifyECDSA(),
        rejectDuplicateAccount(),
        rejectCommonPassword('password'),
        hashPassword('password')
      ),
      // iff(
      //   isProvider('external'),
      //   keep(...Object.keys(createUserSchema.properties))
      // ),
      // alterItems((user) => {
      //   user.accountSelected = 0
      //   user.authorizationSelected = ''
      // }),
      timestamp('created'),
      timestamp('updated')
    ],
    update: [
      // no updates allowed
      ...restrict,
      disallow('external'),
      // validateSchema(createUserSchema, ajv),
      rejectCommonPassword(),
      verifyECDSA(),
      rejectDuplicateAccount(),
      hashPassword('password'),
      timestamp('updated')
    ],
    patch: [
      paramsFromClient('signature', 'document', 'token', 'action'),
      // action = 'resend-email-verification'
      // id required to check authorization
      // typ: access token required
      resendEmailVerification(),
      // validation
      rejectDuplicateAccount(),
      rejectCommonPassword('password'),
      hashPassword('password'),
      // patch account verified
      // id null to skip authorization
      // typ: verifyEmail token required
      // typ: access token not required
      //
      // patch password
      // id null to skip authorization
      // typ: resetPassword token required
      // typ: access token not required
      verifyToken(),
      // patch info, , patch password (required elevated access)
      // iff(isProvider('external'), )
      // ...restrict,
      // verifyECDSA(),
      // iff(
      //   (c) => !c.result,
      // ),
      timestamp('updated')
      // iff(
      //   isProvider('external'),
      //   keep(...Object.keys(patchUserSchema.properties))
      // )
    ],
    remove: [authenticate('jwt'), disallow('external')]
    // !end
  },

  after: {
    // Your hooks should include:
    //   all   : protect('password') // Must always be the last hook
    // !code: after
    all: [
      when(
        (hook) => hook.params.provider, // Will be undefined for internal calls from the server
        protect('password') /* Must always be the last hook */
      )
      // populate({
      //   schema: {
      //     include: {
      //       service: 'user-authorizations',
      //       nameAs: 'authorizations',
      //       parentField: '_id',
      //       childField: 'userId',
      //       asArray: true,
      //       query: {
      //         $select: ['scope', 'created', 'updated'],
      //         $sort: { updated: -1 }
      //       }
      //     }
      //   }
      // })
    ],
    find: [],
    get: [],
    create: [savePublicKey(), sendEmailVerification()],
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
function sendPasswordReset (
  expiresIn = '30m',
  error = new BadRequest({
    message: `invalid account`,
    errors: {
      account: `Invalid account`
    }
  })
) {
  return async (context) => {
    // check type === before
    checkContext(context, 'before', ['create'], 'sendPasswordReset')
    const { app, data, params, service } = context
    const { action } = params
    if (action !== 'request-password-reset') return context
    // user data instead of result because we want to check the submitted data
    const { accounts, language = 'en' } = data
    if (!Array.isArray(accounts)) throw error
    const [{ type, value } = {}] = accounts
    if (!(type === 'email' && value)) throw error
    // find account in users service
    const {
      total,
      data: [user]
    } = await service.find({
      query: {
        'accounts.value': value
      }
    })
    let email
    if (total === 0) {
      // send attempted email reset
      email = {
        templateName: 'attempted-password-reset',
        email: value,
        language,
        locals: {
          url: `${process.env.UI_URL}/auth/sign-up`,
          logo: 'cid:logo'
        }
      }
    } else {
      // > console.dir(id)
      // ObjectID {
      //   _bsontype: 'ObjectID',
      //   id:
      //     Buffer[Uint8Array][
      //       (93, 76, 117, 103, 42, 88, 174, 57, 28, 108, 50, 212)
      //     ]
      // }
      // > id.getTimestamp()
      // 2019-08-08T19:17:59.000Z
      // > id.toHexString()
      // '5d4c75672a58ae391c6c32d4'
      // sign jwt
      const { _id: userId } = user
      const payload = {}
      const { secret, jwtOptions } = app.get('authentication')
      const options = merge({}, jwtOptions, {
        header: { typ: 'resetPassword' },
        audience: value,
        subject: userId.toHexString(),
        expiresIn
      })
      app.debug('jwt.sign', payload, options)
      const token = jwt.sign(payload, secret, options)
      // eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjUyODkyNzQsImV4cCI6MTU2NTI5MTA3NCwiYXVkIjoiaG90ZG9nZWVAZ21haWwuY29tIiwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjEyMzEyMzEyMyJ9.P5mq4J2VR-RJsdPC9lrGnAZXd8u2azeF_DyWXYHIXDQ
      // jwt.verify(token, secret, options)
      // const payload = {
      //   iat: 1565289274,
      //   exp: 1565291074,
      //   aud: 'hotdogee@gmail.com',
      //   iss: 'hanl.in',
      //   sub: '123123123'
      // }
      app.debug('token', token)
      email = {
        templateName: 'password-reset',
        email: value,
        language: user.language || 'en',
        locals: {
          url: `${process.env.UI_URL}/auth/reset-password?token=${token}`,
          logo: 'cid:logo'
        }
      }
    }
    app.debug(`app.service('emails').create`, email)
    await app.service('emails').create(email)
    context.result = {
      result: 'success'
    }
    return context
  }
}

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
    // check type === before
    checkContext(context, 'before')
    if (!context.data[fieldName]) return context
    if (commonPassword(context.data[fieldName])) {
      debug('Password is too easy to guess')
      throw error
    }
    return context
  }
}

function rejectDuplicateAccount (
  error = new BadRequest({
    message: `account exists`,
    errors: {
      account: `account exists`
    }
  })
) {
  return async (context) => {
    // check type === before
    checkContext(context, 'before')
    const { id, data, service } = context
    const { accounts } = data
    if (!Array.isArray(accounts)) return context
    const [{ type, value } = {}] = accounts
    if (!(type && value)) return context
    // check if fieldName value exists in db
    const params = {
      query: {
        'accounts.type': type,
        'accounts.value': value,
        $limit: 0
      }
    }
    if (id) {
      // update or patch
      params.query._id = { $ne: id }
    }
    const { total } = await service.find(params)
    if (total > 0) {
      throw error
    }
    return context
  }
}

function sendEmailVerification (expiresIn = '30m') {
  return async (context) => {
    // check type === after
    checkContext(context, 'after', ['create'], 'createEmailVerification')
    const { app, data, result } = context
    // use data instead of result because we want to check the submitted data
    const { accounts } = data
    if (!Array.isArray(accounts)) return context
    const [{ type, value } = {}] = accounts
    if (!(type === 'email' && value)) return context
    const { _id: userId, language } = result
    createEmailVerification(app, value, userId, expiresIn, language)
    return context
  }
}

function resendEmailVerification (
  expiresIn = '30m',
  error = new BadRequest({
    message: `invalid account`,
    errors: {
      account: `Invalid account`
    }
  })
) {
  return async (context) => {
    // check type === before
    checkContext(context, 'before', ['patch'], 'resendEmailVerification')
    const { app, data, params, subject } = context
    const { action } = params
    if (action !== 'resend-email-verification') return context
    // use data instead of result because we want to check the submitted data
    const { accounts } = data
    if (!Array.isArray(accounts)) throw error
    const [{ type, value } = {}] = accounts
    if (!(type === 'email' && value)) throw error
    const { _id: userId, language = 'en' } = subject
    createEmailVerification(app, value, userId, expiresIn, language)
    return context
  }
}

function createEmailVerification (app, value, userId, expiresIn, language) {
  // > console.dir(id)
  // ObjectID {
  //   _bsontype: 'ObjectID',
  //   id:
  //     Buffer[Uint8Array][
  //       (93, 76, 117, 103, 42, 88, 174, 57, 28, 108, 50, 212)
  //     ]
  // }
  // > id.getTimestamp()
  // 2019-08-08T19:17:59.000Z
  // > id.toHexString()
  // '5d4c75672a58ae391c6c32d4'
  // sign jwt
  const payload = {}
  const { secret, jwtOptions } = app.get('authentication')
  const options = merge({}, jwtOptions, {
    header: { typ: 'verifyEmail' },
    audience: value,
    subject: userId.toHexString(),
    expiresIn
  })
  app.debug('jwt.sign', payload, options)
  const token = jwt.sign(payload, secret, options)
  // eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjUyODkyNzQsImV4cCI6MTU2NTI5MTA3NCwiYXVkIjoiaG90ZG9nZWVAZ21haWwuY29tIiwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjEyMzEyMzEyMyJ9.P5mq4J2VR-RJsdPC9lrGnAZXd8u2azeF_DyWXYHIXDQ
  // jwt.verify(token, secret, options)
  // const payload = {
  //   iat: 1565289274,
  //   exp: 1565291074,
  //   aud: 'hotdogee@gmail.com',
  //   iss: 'hanl.in',
  //   sub: '123123123'
  // }
  app.debug('token', token)
  const email = {
    templateName: 'email-verification',
    email: value,
    language,
    locals: {
      url: `${process.env.UI_URL}/auth/verify-email?token=${token}`,
      complaintEmail: process.env.COMPLAINT_EMAIL,
      logo: 'cid:logo'
    }
  }
  app.debug(`app.service('emails').create`, email)
  app.service('emails').create(email)
}

function verifyToken () {
  return async (context) => {
    // check type === before
    checkContext(context, 'before', ['patch'], 'verifyToken')
    const { app, params, service, data } = context
    const { token } = params
    if (!token) return context
    const { secret, jwtOptions } = app.get('authentication')
    const options = merge({}, jwtOptions, {
      complete: true
    })
    // verify checks signature, expires and issuer
    const { payload, header } = jwt.verify(token, secret, options)
    // {
    //   header: { alg: 'HS256', typ: 'verifyEmail' },
    //   payload: {
    //     iat: 1565289274,
    //     exp: 1565291074,
    //     aud: 'hotdogee@gmail.com',
    //     iss: 'hanl.in',
    //     sub: '123123123'
    //   },
    //   signature: 'P5mq4J2VR-RJsdPC9lrGnAZXd8u2azeF_DyWXYHIXDQ'
    // }
    const { typ } = header
    if (typ === 'verifyEmail') {
      // set id, data and result
      await service.patch(
        payload.sub,
        {
          'accounts.$.verified': new Date()
        },
        {
          query: {
            'accounts.value': payload.aud
          }
        }
      )
      context.result = {
        result: 'success'
      }
    } else if (typ === 'resetPassword') {
      const { password } = data
      // set id, data and result
      await service._patch(payload.sub, {
        password
      })
      context.result = {
        result: 'success'
      }
    }
    return context
  }
}

// function addTestAuth () {
//   return async (context) => {
//     try {
//       // context.app.service('user-authorizations').create({
//       //   userId: context.result._id,
//       //   scope: {
//       //     role: 'patient',
//       //     org: 'mmh',
//       //     patientId: 14958
//       //   }
//       // })
//       // context.app.service('user-authorizations').create({
//       //   userId: context.result._id,
//       //   scope: {
//       //     role: 'embryologist',
//       //     org: 'mmh'
//       //   }
//       // })
//       return context
//     } catch (error) {
//       debug(error)
//       throw error
//     }
//   }
// }

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
