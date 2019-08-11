// Configure authentication. (Can be re-generated.)
const {
  AuthenticationService,
  JWTStrategy,
  AuthenticationBaseStrategy
} = require('@feathersjs/authentication')
const { LocalStrategy } = require('@feathersjs/authentication-local')
const { OAuthStrategy, setup } = require('@feathersjs/authentication-oauth')

// !code: imports
const debug = require('debug')('scada:auth')
// const { verifyECDSA, savePublicKey } = require('./hooks/ecdsa')
const { verify } = require('./lib/ecdsa')
// const CustomStrategy = require('passport-custom')
// const { iff } = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// const bcrypt = require('bcryptjs')
const { omit, merge, get } = require('lodash')
const safeStringify = require('fast-safe-stringify')
const querystring = require('querystring')
const axios = require('axios')
const request = require('request-compose').extend({
  Request: { oauth: require('request-oauth') }
}).client

const {
  getDefaultSettings
} = require('@feathersjs/authentication-oauth/lib/utils')
const { express } = require('grant')
const { original } = require('@feathersjs/express')
const qs = require('querystring')
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
// !end
// !code: init
// class LocalVerifier {
//   constructor (app, options = {}) {
//     this.app = app
//     this.options = options
//     this.service =
//       typeof options.service === 'string'
//         ? app.service(options.service)
//         : options.service

//     if (!this.service) {
//       throw new Error(
//         `options.service does not exist.\n\tMake sure you are passing a valid service path or service instance and it is initialized before @feathersjs/authentication-local.`
//       )
//     }

//     this._comparePassword = this._comparePassword.bind(this)
//     this.verify = this.verify.bind(this)
//   }

//   _comparePassword (entity, password) {
//     // select entity password field - take entityPasswordField over passwordField
//     const passwordField =
//       this.options.entityPasswordField || this.options.passwordField

//     // find password in entity, this allows for dot notation
//     const hash = get(entity, passwordField)

//     if (!hash) {
//       return Promise.reject(
//         new Error(
//           `'${
//             this.options.entity
//           }' record in the database is missing a '${passwordField}'`
//         )
//       )
//     }

//     debug('Verifying password')

//     return new Promise((resolve, reject) => {
//       bcrypt.compare(password, hash, function (error, result) {
//         // Handle 500 server error.
//         if (error) {
//           return reject(error)
//         }

//         if (!result) {
//           debug('Password incorrect')
//           return reject(false) // eslint-disable-line
//         }

//         debug('Password correct')
//         return resolve(entity)
//       })
//     })
//   }

//   async verify (req, username, password, done) {
//     debug('Checking credentials', username, password)

//     const id = this.service.id
//     if (id === null || id === undefined) {
//       debug('failed: the service.id was not set')
//       return done(
//         new Error(
//           'the `id` property must be set on the entity service for authentication'
//         )
//       )
//     }

//     const usernameField =
//       this.options.entityUsernameField || this.options.usernameField
//     const passwordField =
//       this.options.entityPasswordField || this.options.passwordField
//     debug('this.options', this.options)
//     // this.options = { name: 'local',
//     //   usernameField: 'email',
//     //   passwordField: 'password',
//     //   entity: 'user',
//     //   service: 'users',
//     //   passReqToCallback: true,
//     //   session: false
//     // }
//     const params = Object.assign(
//       {
//         query: {
//           'accounts.value': username,
//           $limit: 1
//         }
//       },
//       omit(req.params, 'query', 'provider', 'headers', 'session', 'cookies')
//     )

//     // Look up the entity
//     try {
//       const response = await this.service.find(params)
//       const results = response.data || response
//       if (!results.length) {
//         debug(`a record with ${usernameField} of '${username}' did not exist`)
//         return done(null, false, {
//           message: 'invalid login',
//           errors: {
//             [usernameField]: `${usernameField} not found`
//           }
//         })
//       }
//       const entity = results[0]
//       debug(`${this.options.entity} found`)
//       try {
//         await this._comparePassword(entity, password)
//       } catch (error) {
//         return error
//           ? done(error)
//           : done(null, error, {
//             message: 'invalid login',
//             errors: {
//               [passwordField]: `${passwordField} incorrect`
//             }
//           })
//       }
//       const id = entity[this.service.id]
//       const payload = { [`${this.options.entity}Id`]: id }
//       return done(null, entity, payload)
//     } catch (error) {
//       return error
//         ? done(error)
//         : done(null, error, { message: 'invalid login' })
//     }
//   }
// }

// function ecdsa (options) {
//   return (app) => {
//     // register the strategy in the app.passport instance
//     app.passport.use(
//       'ecdsa',
//       new CustomStrategy(async (req, done) => {
//         // get publicKey and userId
//         // if found in public-keys service
//         // debug('req', req)
//         // req = {
//         //   query:
//         //   {
//         //     strategy: 'ecdsa',
//         //       signature:
//         //     'aw/eqZUl8V4ZZgUpP3N9I+gUyMzGeAC3MztbRs4sR8rf4HJtTo9nyMAvu5voIPVaDi+Q8qmykI+DnxkkwBanaQ==',
//         //       signed:
//         //     {
//         //       email: 'test',
//         //         publicKey:
//         //       '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"6pbau5nEINyQP5DZB4H3LRZsczEB3HAGyyqomulTZ0c","y":"I1K1I3SZKYyToPi4p8SXHVLcHfInECXQjjJgJilhFUk"}',
//         //         timestamp: '2018-11-10T07:44:19.650Z',
//         //           userAgent:
//         //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
//         //     }
//         //   },
//         //   body:
//         //   {
//         //     strategy: 'ecdsa',
//         //       signature:
//         //     'aw/eqZUl8V4ZZgUpP3N9I+gUyMzGeAC3MztbRs4sR8rf4HJtTo9nyMAvu5voIPVaDi+Q8qmykI+DnxkkwBanaQ==',
//         //       signed:
//         //     {
//         //       email: 'test',
//         //         publicKey:
//         //       '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"6pbau5nEINyQP5DZB4H3LRZsczEB3HAGyyqomulTZ0c","y":"I1K1I3SZKYyToPi4p8SXHVLcHfInECXQjjJgJilhFUk"}',
//         //         timestamp: '2018-11-10T07:44:19.650Z',
//         //           userAgent:
//         //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
//         //     }
//         //   },
//         //   params:
//         //   {
//         //     query: { },
//         //     provider: 'socketio',
//         //       headers:
//         //     {
//         //       authorization:
//         //       'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1YmU0YTM3NGJmMmJhYzljZDhiMDNmZjQiLCJpYXQiOjE1NDE4MzU4NTQsImV4cCI6MTYyODE0OTQ1NCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIiwianRpIjoiM2Y4NjFiMWYtMzExMy00Y2VmLTk4Y2EtNDUzNGI1OThiN2M3In0.YNi6LFqwCUD6E4G01AkJkARQq0hOe7-uZRZk2naQV-w'
//         //     },
//         //     session: { },
//         //     cookies: { },
//         //     payload: { userId: 5be4a374bf2bac9cd8b03ff4 },
//         //     user:
//         //     {
//         //       _id: 5be4a374bf2bac9cd8b03ff4,
//         //         email: 'test',
//         //           password:
//         //       '$2a$13$ngjPDR2K4gCiIXI8xt/I1ucpW2yBm5.BNx9OnmvudF/dByO1kvQ7a',
//         //         role: 'user',
//         //           created: 2018 - 11 - 08T20: 58: 28.492Z,
//         //             updated: 2018 - 11 - 08T20: 58: 28.492Z
//         //     },
//         //     accessToken:
//         //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1YmU0YTM3NGJmMmJhYzljZDhiMDNmZjQiLCJpYXQiOjE1NDE4MzU4NTQsImV4cCI6MTYyODE0OTQ1NCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIiwianRpIjoiM2Y4NjFiMWYtMzExMy00Y2VmLTk4Y2EtNDUzNGI1OThiN2M3In0.YNi6LFqwCUD6E4G01AkJkARQq0hOe7-uZRZk2naQV-w',
//         //       authenticated: true
//         //   },
//         //   headers:
//         //   {
//         //     authorization:
//         //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1YmU0YTM3NGJmMmJhYzljZDhiMDNmZjQiLCJpYXQiOjE1NDE4MzU4NTQsImV4cCI6MTYyODE0OTQ1NCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIiwianRpIjoiM2Y4NjFiMWYtMzExMy00Y2VmLTk4Y2EtNDUzNGI1OThiN2M3In0.YNi6LFqwCUD6E4G01AkJkARQq0hOe7-uZRZk2naQV-w'
//         //   },
//         //   cookies: { },
//         //   session: { }
//         // }
//         // check if (userId, publicKey) in db
//         // debug('req.body = ', req.body)
//         // req.body = {
//         //   strategy: 'ecdsa',
//         //   signature:
//         //     'MDCBpcOxvWw9XLHErevFb1CUT5kKRiFpIx1o2X1zXb8Qcd4Nm4VvuJ4ADfjGflOQy0WZKB60CDjf8sYVO/dupA==',
//         //   signed:
//         //   {
//         //     data: { userId: '5be8fbb5bd9e9eaed0f49421' },
//         //     publicKey:
//         //       '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"ikqTrtFcBGyFtP-uysv9p1StYQHcXqshkMfM5drpFBU","y":"5M-n_REedcxsWvg32MraG7SRxqaTmhBpGiqirOlhBEM"}',
//         //     timestamp: '2018-11-12T04:14:03.754Z',
//         //     userAgent:
//         //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
//         //   }
//         // }
//         if (
//           req.body.signed.payload.userId == null ||
//           req.body.signed.publicKey == null
//         ) {
//           return done(null, false)
//         }
//         const params = {
//           query: {
//             _id: req.body.signed.publicKey,
//             userId: new ObjectID(req.body.signed.payload.userId)
//           }
//         }
//         debug('params = ', params)
//         // params = {
//         //   query:
//         //   {
//         //     userId: '5be8fbb5bd9e9eaed0f49421',
//         //     publicKey:
//         //       '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"3GGFsa-Gd62wF727WGjfDXfP2xU2AAHS-oso6ePgVgY","y":"H3ALP6tISDcnp0g-6gj03LZ0w_87Z3IAwk4hEDZgYLQ"}'
//         //   }
//         // }
//         // {"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"LbOOxTweEiDueuSf5mSP0GEWK5SMA96olxtlWJF_KrU","y":"qrWzsgYwPXFVfoRbfoB9H-SGnsdzHKPnVY2gS-9SE1Y"}
//         const result = await app.service('public-keys').find(params)
//         // result = { total: 0, limit: 50, skip: 0, data: [] }
//         // result = {
//         //   total: 1,
//         //   limit: 50,
//         //   skip: 0,
//         //   data:
//         //     [{
//         //       _id: 5be9027a479a04bc508a5d92,
//         //       publicKey:
//         //         '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"M5hweD-T-FGE0ZS6Zv4IE_Hs4bkzF5sS0WjYhSeYHro","y":"k10dIOLPI6SNhkJ8v4hZbsoD-vxAVpV2vZOfPwvUWOk"}',
//         //       signed: [Object],
//         //       signature:
//         //         'Gz6Ao5uvB4AjZJIc80GwbltlkKa92TxnNKovVKHmCVWL79xD/xwhdfjEx9oj4TisP8Ezuu/NDzeJPl1SCnR+cQ==',
//         //       userId: 5be8fbb5bd9e9eaed0f49421
//         //     }]
//         // }
//         debug('result = ', result)
//         if (result.total === 0) {
//           return done(null, false)
//         }
//         // done(err, user, info)
//         const user = await app.service('users').get(params.query.userId)
//         debug('user = ', user)
//         done(null, user, { userId: params.query.userId })
//       })
//     )
//   }
// }

class APIKeyJWTStrategy extends JWTStrategy {
  async authenticate (authentication, params) {
    // this.app.debug(`super.authenticate (authentication, params) = `, {
    //   authentication,
    //   params
    // })
    // const authentication = {
    //   strategy: 'jwt',
    //   accessToken:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNjg3MzIsImV4cCI6MTU2NTM3MDUzMiwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGQ4NjBiMDliOWQxM2FmYzZkMjNlZSIsImp0aSI6IjQ1NzgwNzk0LTlmNDItNDZiZi04ZTIwLTNiOTQxYWIxMTEwNCJ9.MiOcubW9fgbKAKuH4owTZcGFP1J5lB1lw66NDyAGOuA',
    //   query: {},
    //   route: {},
    //   connection: {
    //     provider: 'socketio',
    //     headers: {
    //       'user-agent': 'node-XMLHttpRequest',
    //       accept: '*/*',
    //       host: 'localhost:8081',
    //       connection: 'close'
    //     }
    //   },
    //   provider: 'socketio',
    //   headers: {
    //     'user-agent': 'node-XMLHttpRequest',
    //     accept: '*/*',
    //     host: 'localhost:8081',
    //     connection: 'close'
    //   },
    //   authenticated: true
    // }
    // rest params = {
    //   route: {},
    //   headers: {
    //     accept: 'application/json',
    //     'content-type': 'application/json',
    //     authorization:
    //       'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNzQ0NjgsImV4cCI6MTU2NTM3NDQ3OCwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGQ4NjBiMDliOWQxM2FmYzZkMjNlZSIsImp0aSI6IjRjMDc4YTk4LTBkZjUtNGI3YS04N2I5LWE5MWM0N2ExMjcxZiJ9.7AYUE--iq-0znexMoAPHq1mJ3FPvFGG0iL3gIObMi0c',
    //     'content-length': '57',
    //     'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
    //     'accept-encoding': 'gzip,deflate',
    //     connection: 'close',
    //     host: 'localhost:8081'
    //   },
    //   authenticated: true
    // }
    // socketio params = {
    //   route: {},
    //   connection: {
    //     provider: 'socketio',
    //     headers: {
    //       'user-agent': 'node-XMLHttpRequest',
    //       accept: '*/*',
    //       host: 'localhost:8081',
    //       connection: 'close'
    //     },
    //     clientIp: '::ffff:127.0.0.1',
    //     authentication: {
    //       strategy: 'jwt',
    //       accessToken:
    //         'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNzQ1ODgsImV4cCI6MTU2NTM3NDU5OCwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGQ4NjBiMDliOWQxM2FmYzZkMjNlZSIsImp0aSI6ImMwNjE1ODcxLTNjYTYtNDM2Yi1hNGQzLWRlOGIzZTJjMDIxNyJ9.ph_29cDnxHNmEudrPA0GQXpRCykDI637WyAXqrWNm10'
    //     },
    //     user: {
    //       _id: '5d4d860b09b9d13afc6d23ee',
    //       accounts: [
    //         {
    //           type: 'email',
    //           value: 'hotdogee@gmail.com',
    //           verified: '2019-08-09T14:52:41.732Z'
    //         }
    //       ],
    //       language: 'en',
    //       country: 'tw',
    //       created: '2019-08-09T14:41:15.799Z',
    //       updated: '2019-08-09T14:52:41.737Z',
    //       authorizations: [{ org: 'hanl.in', role: 'admin' }]
    //     }
    //   },
    //   headers: {
    //     'user-agent': 'node-XMLHttpRequest',
    //     accept: '*/*',
    //     host: 'localhost:8081',
    //     connection: 'close'
    //   },
    //   clientIp: '::ffff:127.0.0.1',
    //   user: {
    //     _id: '5d4d860b09b9d13afc6d23ee',
    //     accounts: [
    //       {
    //         type: 'email',
    //         value: 'hotdogee@gmail.com',
    //         verified: '2019-08-09T14:52:41.732Z'
    //       }
    //     ],
    //     language: 'en',
    //     country: 'tw',
    //     created: '2019-08-09T14:41:15.799Z',
    //     updated: '2019-08-09T14:52:41.737Z',
    //     authorizations: [{ org: 'hanl.in', role: 'admin' }]
    //   },
    //   authenticated: true
    // }
    const result = await super.authenticate(authentication, params)
    // this.app.debug(`super.authenticate result = `, { result })
    // const result = {
    //   accessToken:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNjkwNDUsImV4cCI6MTU2NTM3MDg0NSwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGQ4NjBiMDliOWQxM2FmYzZkMjNlZSIsImp0aSI6IjEwODllNDJmLWYwYTYtNGM4Mi04ZmFjLWVjODRhZmI3N2QyYSJ9.L0mhgS5PCL8aCsw0ae_8E95iNEpFXAHUdkD55G7Y35U',
    //   authentication: {
    //     strategy: 'jwt',
    //     payload: {
    //       iat: 1565369045,
    //       exp: 1565370845,
    //       iss: 'hanl.in',
    //       sub: '5d4d860b09b9d13afc6d23ee',
    //       jti: '1089e42f-f0a6-4c82-8fac-ec84afb77d2a'
    //     }
    //   },
    //   user: {
    //     _id: '5d4d860b09b9d13afc6d23ee',
    //     accounts: [
    //       {
    //         type: 'email',
    //         value: 'hotdogee@gmail.com',
    //         verified: '2019-08-09T14:52:41.732Z'
    //       }
    //     ],
    //     password:
    //       '$2a$10$4CPRGVRUgcpAAfAWxV9J3eB6S8ClJZHmrJYIAM4POM1vHzBgikWIi',
    //     language: 'en',
    //     country: 'tw',
    //     created: '2019-08-09T14:41:15.799Z',
    //     updated: '2019-08-09T14:52:41.737Z',
    //     authorizations: [{ org: 'hanl.in', role: 'admin' }]
    //   }
    // }
    // if aud in payload
    const {
      authentication: {
        payload: { aud }
      }
    } = result
    if (aud === 'api-key') {
      // check service('api-keys')
      try {
        // eslint-disable-next-line no-unused-vars
        const apiKey = await this.app
          .service('api-keys')
          .get(authentication.accessToken)
        // this.app.debug('api-keys', apiKey)
        // const apiKey = {
        //   _id:
        //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNzY3NTIsImV4cCI6MTg4MDk1Mjc1MiwiYXVkIjoiYXBpLWtleSIsImlzcyI6ImhhbmwuaW4iLCJzdWIiOiI1ZDRkODYwYjA5YjlkMTNhZmM2ZDIzZWUifQ.f34B051mLIYO0Fe1zh2jL_SK-oRV3SUOXgiuy5XTmAM',
        //   name: 'geo9-pi3p1',
        //   userId: '5d4d860b09b9d13afc6d23ee',
        //   created: '2019-08-09T18:52:32.267Z',
        //   updated: '2019-08-09T18:52:32.267Z'
        // }
        // verify IPs
        // verify domains
        // verify geolocations
        return result
      } catch (error) {
        // TypeError: Cannot read property 'get' of undefined
        // NotFound: No record found for id '123123123123'
        throw new NotAuthenticated(`Invalid api-key`)
      }
    } else {
      return result
    }
  }
}

class ECDSAStrategy extends AuthenticationBaseStrategy {
  get configuration () {
    const authConfig = this.authentication.configuration
    const config = super.configuration || {}

    return {
      service: authConfig.service,
      entity: authConfig.entity,
      entityId: authConfig.entityId,
      errorMessage: 'Invalid login',
      ...config
    }
  }

  async getEntity (id, params) {
    const { entity } = this.authentication.configuration
    const entityService = this.entityService
    if (entityService === null) {
      throw new NotAuthenticated(`Could not find entity service`)
    }
    const result = await entityService.get(id, omit(params, 'provider'))
    if (!params.provider) {
      return result
    }
    return entityService.get(id, { ...params, [entity]: result })
  }

  async authenticate (authentication, params) {
    // const authentication = {
    //   strategy: 'ecdsa',
    //   signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
    //   document: {
    //     payload: {
    //       userId: state.user._id
    //     },
    //     publicKey: JSON.stringify(publicKey),
    //     timestamp: new Date(),
    //     // timestamp: new Date('2018-11-06T07:34:20.671Z'),
    //     userAgent: navigator.userAgent
    //   }
    // }
    const { signature, document } = authentication
    const valid = await verify(signature, document)
    if (!valid) {
      // this
      debug(`ECDSA signature verification failed`)
      throw new NotAuthenticated(`ECDSA signature verification failed`)
    }

    const {
      publicKey,
      payload: { userId }
    } = document
    if (!userId) {
      debug(`No user id`)
      throw new NotAuthenticated('No user id')
    }
    if (!publicKey) {
      debug(`No public key`)
      throw new NotAuthenticated('No public key')
    }

    const query = {
      _id: publicKey,
      userId: new ObjectID(userId)
    }
    debug('ECDSAStrategy public-keys query = ', query)
    const keyService = this.app.service('public-keys')
    // const keyParams = Object.assign({}, params, { query })
    // debug('ECDSAStrategy public-keys params = ', keyParams)
    const result = await keyService.find({ query })
    debug('ECDSAStrategy public-keys result = ', result)
    const list = Array.isArray(result) ? result : result.data
    if (!Array.isArray(list) || list.length === 0) {
      debug(`No public key found`)
      throw new NotAuthenticated('Invalid login')
    }

    // debug('ECDSAStrategy authentication.configuration = ', this.authentication, this.authentication.configuration)
    const { entity } = this.authentication.configuration
    const user = await this.getEntity(query.userId, params)
    debug('ECDSAStrategy user = ', user)

    // authResult = {
    //   authentication: { strategy: name },
    //   user: User
    // }
    return {
      authentication: { strategy: this.name },
      [entity]: user
    }
  }
}

// class AnonymousStrategy extends AuthenticationBaseStrategy {
//   authenticate (authentication, params) {
//     return {
//       anonymous: true
//     }
//   }
// }

class MultiAccountLocalStrategy extends LocalStrategy {
  async findEntity (username, params) {
    const { entityUsernameField, service, errorMessage } = this.configuration
    const query = await this.getEntityQuery(
      {
        [entityUsernameField]: username
      },
      params
    )
    const findParams = Object.assign({}, params, { query })
    const entityService = this.app.service(service)
    debug('Finding entity with query', params.query)
    const result = await entityService.find(findParams)
    const list = Array.isArray(result) ? result : result.data
    if (!Array.isArray(list) || list.length === 0) {
      debug(`No entity found`)
      throw new NotAuthenticated(errorMessage)
    }
    const [entity] = list
    return entity
  }

  async authenticate (authentication, params) {
    // const authentication = {
    //   strategy: 'local',
    //   'accounts.value': credentials.email,
    //   password: credentials.password,
    //   signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
    //   document: {
    //     payload: {
    //       'accounts.value': credentials.email
    //     },
    //     publicKey: JSON.stringify(publicKey),
    //     timestamp: new Date(),
    //     // timestamp: new Date('2018-11-06T07:34:20.671Z'),
    //     userAgent: navigator.userAgent
    //   }
    // }
    const { signature, document } = authentication
    const valid = await verify(signature, document)
    if (!valid) {
      // this
      debug(`ECDSA signature verification failed`)
      throw new NotAuthenticated(`ECDSA signature verification failed`)
    }

    const {
      usernameField,
      passwordField,
      entityId = this.entityService.id,
      entity
    } = this.configuration
    const { publicKey, payload } = document
    const username = payload[usernameField]
    const result = await this.findEntity(username, omit(params, 'provider'))

    const password = authentication[passwordField]
    await this.comparePassword(result, password)

    // savePublicKey
    if (!entityId || !result[entityId]) {
      throw new NotAuthenticated('Could not get local entity')
    }
    const keyService = this.app.service('public-keys')
    keyService.create({
      _id: publicKey,
      document: safeStringify(document),
      signature,
      userId: result[entityId]
    })

    return {
      authentication: { strategy: this.name },
      [entity]: await this.getEntity(result, params)
    }
  }
}

class MultiAccountOAuthStrategy extends OAuthStrategy {
  // const data = {
  //   accounts: [
  //     {
  //       type: 'email',
  //       value: credentials.email
  //     }
  //   ],
  //   password: credentials.password,
  //   recaptchaToken: credentials.recaptchaToken,
  //   locale: rootGetters['localSettings/locale'],
  //   signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
  //   document
  // }

  async getRedirect (data) {
    const { redirect } = this.authentication.configuration.oauth

    if (!redirect) {
      return null
    }

    const separator = redirect.endsWith('?') ? '' : '#'
    const authResult = data
    const query = authResult.accessToken
      ? {
        access_token: authResult.accessToken
      }
      : {
        error: data.message || 'OAuth Authentication not successful'
      }

    return redirect + separator + querystring.stringify(query)
  }

  async getEntityQuery (profile, params) {
    return {
      'accounts.type': this.name,
      'accounts.value': profile.sub || profile.id
    }
  }

  async findEntity (profile, params) {
    // add
    const query = await this.getEntityQuery(profile, params)

    debug('findEntity with query', query)

    const result = await this.entityService.find({
      ...params,
      query
    })
    const [entity = null] = result.data ? result.data : result

    debug('findEntity returning', entity)

    return entity
  }

  async getCurrentEntity (params) {
    // if /oauth/google?token=JWT
    // get entity using jwt strategy
    const { authentication } = params
    const { entity } = this.configuration

    if (authentication && authentication.strategy) {
      debug('getCurrentEntity with authentication', authentication)

      const { strategy } = authentication
      const authResult = await this.authentication.authenticate(
        authentication,
        params,
        strategy
      )

      return authResult[entity]
    }

    return null
  }

  async getEntityData (profile, entity, params) {
    const account = {
      type: this.name,
      value: profile.sub || profile.id,
      ...profile
    }
    if (entity) {
      const i = entity.accounts.findIndex(
        (v) => v.type === account.type && v.value === account.value
      )
      debug(`getEntityData`, i, entity.accounts, account)
      if (i === -1) {
        // create new account in entity
        return {
          accounts: [...entity.accounts, account]
        }
      } else {
        // update existing account in entity
        entity.accounts[i] = account
        return {
          accounts: entity.accounts
        }
      }
    } else {
      // create entity
      return {
        accounts: [account]
      }
    }
  }

  async createEntity (profile, params) {
    const data = await this.getEntityData(profile, null, params)

    debug('createEntity with data', data)

    return this.entityService.create(data, params)
  }

  async updateEntity (entity, profile, params) {
    const id = entity[this.entityId]
    const data = await this.getEntityData(profile, entity, params)

    debug(`updateEntity with id ${id} and data`, data)

    return this.entityService.patch(id, data, params)
  }

  async getProfile (data, params) {
    const config = this.app.get('grant')
    const provider = config[data.strategy]

    debug('get oAuth profile with', data, provider)

    if (provider.name === 'line') {
      // eslint-disable-next-line camelcase
      const { id_token: idToken = {} } = data
      const { payload = {} } = idToken
      return {
        sub: payload.sub,
        name: payload.name,
        picture: payload.picture,
        email: payload.email
      }
    } else if (provider.name === 'twitter') {
      // OAuth oauth_consumer_key="dCGPMs0y2Sbt8PlET5t1ToGJ6",oauth_token="65576906-OSHnCHVNxkFnvjUHtKcawOVIABkyANRpVvIyxcITu",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1561920564",oauth_nonce="rLa1ciqJP7i",oauth_version="1.0",oauth_signature="PeVfrMYjc3pJTNGTV541alYawWU%3D"
      const { body } = await request({
        url: this.configuration.profileUrl,
        oauth: {
          consumer_key: provider.key,
          consumer_secret: provider.secret,
          token: data.access_token,
          token_secret: data.access_secret
        }
      })
      // debug('twitter profile', body)
      return body
    } else {
      return (await axios({
        method: 'get',
        url: this.configuration.profileUrl,
        headers: { Authorization: `Bearer ${data.access_token}` }
      })).data
    }
  }

  async authenticate (authentication, params) {
    const entityField = this.configuration.entity // user
    const profile = await this.getProfile(authentication, params)
    const tokenEntity = await this.getCurrentEntity(params)
    const oauthEntity = await this.findEntity(profile, params)
    let entity = null
    if (tokenEntity) {
      // adding oauth account to current entity
      debug(`adding oauth account to current entity`, tokenEntity)
      if (oauthEntity) {
        throw new BadRequest(
          `Could not add ${this.name} account, already associated with another user`
        )
      }
      // push entity.accounts
      entity = await this.updateEntity(tokenEntity, profile, params)
    } else {
      // new sign in
      if (oauthEntity) {
        // update existing entity with current profile
        debug(`update existing entity with current profile`, oauthEntity)
        entity = await this.updateEntity(oauthEntity, profile, params)
      } else {
        // create new entity
        debug(`create new entity`, profile)
        entity = await this.createEntity(profile, params)
      }
    }

    debug(`result entity`, entity)

    return {
      authentication: { strategy: this.name, oauth: true },
      [entityField]: entity
    }
  }
}

class ECDSAAuthenticationService extends AuthenticationService {
  /**
   * Return the payload for a JWT based on the authentication result.
   * Called internally by the `create` method.
   * @param _authResult The current authentication result
   * @param params The service call parameters
   */
  // async getPayload (authResult, params) {
  //   // Call original `getPayload` first
  //   const payload = await super.getPayload(authResult, params)
  //   const { user } = authResult

  //   if (user && user.permissions) {
  //     payload.permissions = user.permissions
  //   }

  //   return payload
  // }
  /**
   * Return the payload for a JWT based on the authentication result.
   * Called internally by the `create` method.
   * @param _authResult The current authentication result
   * @param params The service call parameters
   */
  async getPayload (_authResult, params) {
    // Uses `params.payload` or returns an empty payload
    const { payload = {} } = params

    return payload
  }

  /**
   * Returns the JWT options based on an authentication result.
   * By default sets the JWT subject to the entity id.
   * @param authResult The authentication result
   * @param params Service call parameters
   */
  async getTokenOptions (authResult, params) {
    const { service, entity, entityId } = this.configuration
    const jwtOptions = merge({}, params.jwtOptions, params.jwt)
    const hasEntity = service && entity && authResult[entity]

    // Set the subject to the entity id if it is available
    if (hasEntity && !jwtOptions.subject) {
      const idProperty = entityId || this.app.service(service).id
      const subject = get(authResult, [entity, idProperty])

      if (subject === undefined) {
        throw new NotAuthenticated(
          `Can not set subject from ${entity}.${idProperty}`
        )
      }

      jwtOptions.subject = `${subject}`
    }
    // if oauth
    if (authResult.authentication.oauth) {
      jwtOptions.audience = 'public-keys'
    }

    return jwtOptions
  }

  /**
   * Create and return a new JWT for a given authentication request.
   * Will trigger the `login` event.
   * @param data The authentication request (should include `strategy` key)
   * @param params Service call parameters
   */
  async create (data, params) {
    const authStrategies =
      params.authStrategies || this.configuration.authStrategies

    if (!authStrategies.length) {
      throw new NotAuthenticated(
        'No authentication strategies allowed for creating a JWT (`authStrategies`)'
      )
    }

    const authResult = await this.authenticate(data, params, ...authStrategies)

    debug('Got authentication result', authResult)

    const [payload, jwtOptions] = await Promise.all([
      this.getPayload(authResult, params),
      this.getTokenOptions(authResult, params)
    ])

    // do not create new accessToken if using JWT strategy
    if (authResult.accessToken) {
      return authResult
    }

    debug('Creating JWT with', payload, jwtOptions)

    const accessToken = await this.createAccessToken(
      payload,
      jwtOptions,
      params.secret
    )

    return Object.assign({}, { accessToken }, authResult)
  }
}

const setupExpress = (options) => {
  return (feathersApp) => {
    const { authService, linkStrategy } = options
    const app = feathersApp
    const config = app.get('grant')
    const prefixPath = app.get('prefixPath')

    if (!config) {
      debug('No grant configuration found, skipping Express oAuth setup')
      return
    }

    const { path } = config.defaults
    const grantApp = express()(config)
    const authApp = original()

    authApp.use(options.expressSession)

    authApp.get('/:name', (req, res) => {
      const { token, ...query } = req.query

      if (token) {
        debug(`Got token query parameter to link accounts`, token)
        req.session.accessToken = token
      }

      debug(
        `/:name redirect = `,
        `${prefixPath}${path}/connect/${req.params.name}?${qs.stringify(query)}`
      )
      res.redirect(
        `${prefixPath}${path}/connect/${req.params.name}?${qs.stringify(query)}`
      )
    })

    authApp.get('/:name/callback', (req, res) => {
      debug(
        `/:name/callback redirect = `,
        `${prefixPath}${path}/connect/${
          req.params.name
        }/callback?${qs.stringify(req.query)}`
      )
      res.redirect(
        `${prefixPath}${path}/connect/${
          req.params.name
        }/callback?${qs.stringify(req.query)}`
      )
    })

    authApp.get('/:name/authenticate', async (req, res, next) => {
      const { name } = req.params
      const { accessToken, grant } = req.session
      const service = app.service(authService)
      const [strategy] = service.getStrategies(name)
      const sendResponse = async (data) => {
        try {
          const redirect = await strategy.getRedirect(data)

          if (redirect !== null) {
            res.redirect(redirect)
          } else if (data instanceof Error) {
            throw data
          } else {
            res.json(data)
          }
        } catch (error) {
          debug('oAuth error', error)
          next(error)
        }
      }

      try {
        const payload =
          config.defaults.transport === 'session' ? grant.response : req.query

        const params = {
          authStrategies: [name],
          authentication: accessToken
            ? {
              strategy: linkStrategy,
              accessToken
            }
            : null
        }

        const authentication = {
          strategy: name,
          ...payload
        }

        debug(
          `Calling ${authService}.create authentication with strategy ${name}`
        )

        const authResult = await service.create(authentication, params)

        debug('Successful oAuth authentication, sending response')

        await sendResponse(authResult)
      } catch (error) {
        debug('Received oAuth authentication error', error.stack)
        await sendResponse(error)
      }
    })

    authApp.use(grantApp)

    app.set('grant', grantApp.config)
    app.use(path, authApp)
  }
}

const grantOauth = (settings = {}) => (app) => {
  const options = getDefaultSettings(app, settings)
  app.configure(setup(options))
  app.configure(setupExpress(options))
}
// !end

const moduleExports = function (app) {
  const authentication = new ECDSAAuthenticationService(app)
  // !code: func_init // !end

  // Set up authentication with the secret
  authentication.register('jwt', new APIKeyJWTStrategy())
  authentication.register('ecdsa', new ECDSAStrategy())
  authentication.register('local', new MultiAccountLocalStrategy())
  authentication.register('google', new MultiAccountOAuthStrategy())
  authentication.register('facebook', new MultiAccountOAuthStrategy())
  authentication.register('twitter', new MultiAccountOAuthStrategy())
  authentication.register('line', new MultiAccountOAuthStrategy())

  // !code: loc_1
  // app.configure(
  //   local({
  //     ...config.local,
  //     Verifier: LocalVerifier
  //   })
  // )
  // app.configure(ecdsa())
  // !end
  // !<DEFAULT> code: user_auth
  app.use('/authentication', authentication)
  // !end
  // !<DEFAULT> code: configure_auth

  app.configure(
    grantOauth()
    // expressOauth()
    // default = {
    //   authService: 'authentication',
    //   linkStrategy: 'jwt',
    //   expressSession: session({
    //     secret: Math.random().toString(36).substring(7),
    //     saveUninitialized: true,
    //     resave: true
    //   }
    // }
  )
  // !end
  // !code: loc_2
  // this sets:
  // app.set('grant', omit(app.get('authentication').oauth, 'redirect'))
  // app.set('grant', require('grant').express()(omit(app.get('authentication').oauth, 'redirect')))
  // * Link to /oauth/google (scada-iot-hmi)
  // * => /oauth/connect/google?query (feathers\packages\authentication-oauth\src\express.ts)
  // * => https://accounts.google.com/o/oauth2/auth?{
  //     client_id: provider.key,
  //     response_type: 'code',
  //     redirect_uri: provider.redirect_uri,
  //     scope: provider.scope,
  //     state: provider.state,
  //     nonce: provider.nonce
  //   } (grant\lib\consumer\express.js)
  //   LINE: https://access.line.me/oauth2/v2.1/authorize?client_id=1593954833&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A6001%2Foauth%2Fline%2Fcallback&scope=profile%20openid%20email&state=12955f5dab6d5a5ebea6&nonce=1b79c043672b8d29794c
  // * Google redirects to redirect_uri /oauth/google/callback?code
  // * => /oauth/connect/google/callback?code=4%2FcwGgoS2zsM5Mr0LE44ILBT0IvuemD2lDn0D90CUf36SkFix6NIh8gUPYtv40GVVOz00t_SkTNjXTgb_YMFgEKLc&scope=email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20openid&authuser=0&session_state=940fe893517701559970078115d70f8db27be64e..abd1&prompt=none  (feathers\packages\authentication-oauth\src\express.ts)
  // * access => {
  //     method: 'POST',
  //     url: 'https://accounts.google.com/o/oauth2/token',
  //     form: {
  //       grant_type: 'authorization_code',
  //       code: '4/cwHto2bFcYRcT975Bg63awX3zGomyMDpQAeaH7OOcdRhXPXN-g3AT7JHo6zIGHq0CR0BRhCoIMyMZ5QhXcRHrDo',
  //       client_id: '830396712455-2pajms642mvqiao4j501nsb4s6bs3stt.apps.googleusercontent.com',
  //       client_secret: 'XmDkQmFzC2GPFXtVuk9UFlWk',
  //       redirect_uri: 'http://localhost:6001/oauth/google/callback'
  //     }
  //   } (grant\lib\consumer\express.js)
  // * access result assigned to session.grant.response = {
  //     id_token: {
  //       header: {
  //         alg: 'RS256',
  //         kid: '118df254b837189d1bc2be9650a82112c00df5a4',
  //         typ: 'JWT'
  //       },
  //       payload: {
  //         iss: 'accounts.google.com',
  //         azp: '830396712455-2pajms642mvqiao4j501nsb4s6bs3stt.apps.googleusercontent.com',
  //         aud: '830396712455-2pajms642mvqiao4j501nsb4s6bs3stt.apps.googleusercontent.com',
  //         sub: '108576876073520472460',
  //         email: 'hotdogee@gmail.com',
  //         email_verified: true,
  //         at_hash: 'udie5Ys1bZFdeLe0XGSFJg',
  //         nonce: 'a8665543ae429dd87ea4',
  //         iat: 1561489138,
  //         exp: 1561492738
  //       },
  //       signature: 'SSCcychfiqrjlCQXBweZGQVhWLX6-IKTKleaUT3InJGqdFl5mYpXnKGnsQW_5YvYldnMU2XrbxvXnZoI4yyWzTyzOvncB9JqUymxC7jR3Cw_udXfCIim5EBC7x5FH86Q3k4OkeKTVlerygWA4XQQ4lDw2UiYw5LxpZ03lbok1Xc9fWh1t51rOXiAYINO2eT3sGpGr2umwXkeqFXywnWVi-nySGCw588mWq7KindxfxyoppDlm6vR2-_ZTaxdTTdHeEkBAb7MbSXMiMNM2j57UfOlHr1bc2hOTWDk1FF-Tz2CVd1xUUe39NuevN29wa51yDzNrqyE4kzWrpUIuK4XJg'
  //     },
  //     access_token: 'ya29.GlwyB94u_S1j_Yge0ngV3c-A5xLWByJuqwEahpgF4izGG2S6-pr2prqo0OgWaJquS4ZCdHIPHKIiQ7qRGvlHiP7LeZfC4Jbl_Fgvrm_G8PNLfVUQFxYlyKA5J5NY0Q',
  //     raw: {
  //       access_token: 'ya29.GlwyB94u_S1j_Yge0ngV3c-A5xLWByJuqwEahpgF4izGG2S6-pr2prqo0OgWaJquS4ZCdHIPHKIiQ7qRGvlHiP7LeZfC4Jbl_Fgvrm_G8PNLfVUQFxYlyKA5J5NY0Q',
  //       expires_in: 3600,
  //       scope: 'https://www.googleapis.com/auth/userinfo.profile ' +
  //         'openid ' +
  //         'https://www.googleapis.com/auth/userinfo.email',
  //       token_type: 'Bearer',
  //       id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExOGRmMjU0YjgzNzE4OWQxYmMyYmU5NjUwYTgyMTEyYzAwZGY1YTQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiODMwMzk2NzEyNDU1LTJwYWptczY0Mm12cWlhbzRqNTAxbnNiNHM2YnMzc3R0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiODMwMzk2NzEyNDU1LTJwYWptczY0Mm12cWlhbzRqNTAxbnNiNHM2YnMzc3R0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA4NTc2ODc2MDczNTIwNDcyNDYwIiwiZW1haWwiOiJob3Rkb2dlZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6InVkaWU1WXMxYlpGZGVMZTBYR1NGSmciLCJub25jZSI6ImE4NjY1NTQzYWU0MjlkZDg3ZWE0IiwiaWF0IjoxNTYxNDg5MTM4LCJleHAiOjE1NjE0OTI3Mzh9.SSCcychfiqrjlCQXBweZGQVhWLX6-IKTKleaUT3InJGqdFl5mYpXnKGnsQW_5YvYldnMU2XrbxvXnZoI4yyWzTyzOvncB9JqUymxC7jR3Cw_udXfCIim5EBC7x5FH86Q3k4OkeKTVlerygWA4XQQ4lDw2UiYw5LxpZ03lbok1Xc9fWh1t51rOXiAYINO2eT3sGpGr2umwXkeqFXywnWVi-nySGCw588mWq7KindxfxyoppDlm6vR2-_ZTaxdTTdHeEkBAb7MbSXMiMNM2j57UfOlHr1bc2hOTWDk1FF-Tz2CVd1xUUe39NuevN29wa51yDzNrqyE4kzWrpUIuK4XJg'
  //     }
  //   } (grant\lib\consumer\express.js)
  // * redirect to provider.callback = /oauth/google/authenticate (grant\lib\consumer\express.js)
  // * app.service('authentication').create({
  //     strategy: 'google',
  //     ...grant.response = {
  //       id_token, access_token, raw
  //     }
  //   }) (feathers\packages\authentication-oauth\src\express.ts)
  // * AuthenticationService.authenticate(data, params, ...authStrategies) (packages\authentication\src\service.create)
  // * authStrategy.authenticate(authentication, {
  //   ...params,
  //   authenticated: true
  // }) (packages\authentication\src\core.AuthenticationBase.authenticate)
  // * get https://openidconnect.googleapis.com/v1/userinfo
  //   headers.authorization = `Bearer ${data.access_token}`
  //   result = {
  //     "sub": "108576876073520472460",
  //     "name": "Han Lin",
  //     "given_name": "Han",
  //     "family_name": "Lin",
  //     "picture": "https://lh6.googleusercontent.com/-Gz9NEs3yqRo/AAAAAAAAAAI/AAAAAAABR-g/irmjLqHJlKU/photo.jpg",
  //     "email": "hotdogee@gmail.com",
  //     "email_verified": true,
  //     "locale": "zh-TW"
  //   }
  // * result = {
  //     accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjE0OTAxMTYsImV4cCI6MTU2MTQ5MTkxNiwiYXVkIjoiYXBpIiwiaXNzIjoiaW5mYW5zLmlvIiwic3ViIjoiNWQxMWI3OWIwZjBlZmI0MmI0MjcxZDBlIiwianRpIjoiNzA3Y2Y2YTgtMjJmZC00MDU2LWFkZTgtNjU4MDIyYTYzOGU2In0.PybsJ14DiGDuW2rWFuUOM5RTLhAdBx2IdBjW6n4PB7U',
  //     authentication: { strategy: 'google' },
  //     user: {
  //       _id: 5d11b79b0f0efb42b4271d0e,
  //       googleId: '108576876073520472460',
  //       accountSelected: 0,
  //       authorizationSelected: 0,
  //       created: 2019-06-25T05:56:43.211Z,
  //       updated: 2019-06-25T19:15:16.199Z,
  //       _include: [ 'authorizations' ],
  //       authorizations: []
  //     }
  //   } (feathers\packages\authentication-oauth\src\strategy.ts)
  // * redirect to UI_URL + '#' + result.accessToken (feathers\packages\authentication-oauth\src\strategy.getRedirect)
  // !end

  // The `authentication` service is used to create a JWT.
  // The before `create` hook registers strategies that can be used
  // to create a new valid JWT (e.g. local or oauth2)
  app.service('authentication').hooks({
    before: {
      create: [
        // !code: before_create
        // authentication.hooks.authenticate(config.strategies),
        // iff((context) => {
        //   // debug('this = ', this)
        //   // this = function(req, res, next) {
        //   //   app.handle(req, res, next);
        //   // }
        //   return context.data.strategy === 'jwt'
        // }, (context) => {
        //   context.result = { accessToken: context.data.accessToken }
        //   return context
        // })
        // !end
      ],
      remove: [
        // !code: before_remove
        // authentication.hooks.authenticate('jwt')
        // !end
        // !<DEFAULT> code: before
      ]
      // !end
      // !code: after
    },
    after: {
      create: [
        // iff((context) => {
        //   // debug('this = ', this)
        //   // this = function(req, res, next) {
        //   //   app.handle(req, res, next);
        //   // }
        //   return context.data.strategy === 'local'
        // }, savePublicKey())
      ]
    }
    // !end
  })
  // !code: func_return // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
