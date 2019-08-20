const safeStringify = require('fast-safe-stringify')
const debug = require('debug')('hooks.ecdsa')
// const WebCrypto = require('node-webcrypto-ossl')
// const webcrypto = new WebCrypto()
const { verify } = require('../lib/ecdsa')
const { checkContext } = require('feathers-hooks-common')

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
  required,
  skipRemainingHooks
  /* eslint-enable no-unused-vars */
} = require('feathers-hooks-common')
// !end

// function _base64ToArrayBuffer (base64) {
//   const bString = window.atob(base64)
//   const len = bString.length
//   const bytes = new Uint8Array(len)
//   for (let i = 0; i < len; i++) {
//     bytes[i] = bString.charCodeAt(i)
//   }
//   return bytes.buffer
// }

// requried data: document, signature
exports.verifyECDSA = function (
  requiredDataFields = ['signature', 'document'],
  invalidError = new BadRequest({
    message: `ECDSA signature verification failed`,
    errors: {
      ecdsa: `ECDSA signature verification failed`
    }
  })
) {
  return async (context) => {
    // {
    //   type: 'before',
    //   method: 'create',
    //   path: 'users',
    //   params: {
    //     authStrategies: [ 'google' ],
    //     authentication: null,
    //     authenticated: true
    //   },
    //   data: { googleId: '108576876073520472460' }
    // }
    // check type === before
    checkContext(context, 'before')
    const { params } = context
    const { provider, signature, document } = params
    // check provider
    if (!provider) {
      debug(`SKIP verifyECDSA (server call)`)
      return context
    }
    // check required data fields
    // throw new errors.BadRequest(`Field ${name} does not exist. (required)`)
    // throw new errors.BadRequest(`Field ${name} is null. (required)`)
    // required(...requiredDataFields)(context)
    // const { signature, document } = data
    // debug(`data = ${safeStringify(data)}`)
    // document = {
    //   payload: { email: credentials.email },
    //   publicKey: safeStringify(publicKey),
    //   timestamp: new Date(),
    //   // timestamp: new Date('2018-11-06T07:34:20.671Z'),
    //   userAgent: navigator.userAgent
    //   // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36"
    // }
    const valid = await verify(signature, document)
    debug(`isValid = ${valid}`)
    if (!valid) {
      throw invalidError
    }
    return context
  }
}

exports.savePublicKey = function () {
  return (context) => {
    // check type === after
    checkContext(context, 'after')
    const { app, params, result, logger } = context
    const log = logger('savePublicKey')
    const { user, provider, signature, document, action } = params
    // check provider
    if (!provider) {
      log.debug(`SKIP (server call)`)
      return context
    }
    // check action
    if (action === 'request-password-reset') {
      log.debug(`SKIP (${action})`)
      return context
    }
    const data = {
      _id: document.publicKey,
      userId: result._id || user._id,
      document: safeStringify(document),
      signature
    }
    app.service('public-keys').create(data)
    return context
    // debug(`context = `, context)
    // context = {
    //   type: 'after',
    //     arguments:
    //   [{ strategy: 'local', email: 'test', password: '123' },
    //   {
    //     query: {},
    //     provider: 'socketio',
    //     headers: {},
    //     session: {},
    //     cookies: {},
    //     authenticated: true,
    //     user: [Object],
    //     payload: [Object]
    //   }],
    //     service:
    //   { },
    //   app:
    //   { },
    //   method: 'create',
    //     path: 'authentication',
    //       data: { strategy: 'local', email: 'test', password: '123' },
    //   params:
    //   {
    //     authenticated: true,
    //       query: { },
    //     provider: 'socketio',
    //       headers: { },
    //     session: { },
    //     cookies: { },
    //     user:
    //     {
    //       _id: 5be4a374bf2bac9cd8b03ff4,
    //         email: 'test',
    //           password:
    //       '$2a$13$ngjPDR2K4gCiIXI8xt/I1ucpW2yBm5.BNx9OnmvudF/dByO1kvQ7a',
    //         role: 'user',
    //           created: 2018 - 11 - 08T20: 58: 28.492Z,
    //             updated: 2018 - 11 - 08T20: 58: 28.492Z
    //     },
    //     payload: { userId: 5be4a374bf2bac9cd8b03ff4 }
    //   },
    //   refreshToken:
    //   {
    //     publicKey:
    //     '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"LSbWtQNF0vI4AkNDXaMp0MWmT4I9mNetlrELlOG5ZVg","y":"U5fc3C8RgDVnaGOxrYecY_8NMGjV5TJfBWzSaG9NuH8"}',
    //       signed:
    //     {
    //       email: 'test',
    //         publicKey:
    //       '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"LSbWtQNF0vI4AkNDXaMp0MWmT4I9mNetlrELlOG5ZVg","y":"U5fc3C8RgDVnaGOxrYecY_8NMGjV5TJfBWzSaG9NuH8"}',
    //         timestamp: '2018-11-10T07:54:27.112Z',
    //           userAgent:
    //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
    //     },
    //     signature:
    //     'hNgZ3OAbZ4bgGDKlSZaiCDqjq3d1zsCkyKx+nvoT1kOADiIXUt3dTva6j8BzPn5ak+tyibWGxd/z18kQlb0L1Q=='
    //   },
    //   result:
    //   {
    //     accessToken:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1YmU0YTM3NGJmMmJhYzljZDhiMDNmZjQiLCJpYXQiOjE1NDE4MzY0NjcsImV4cCI6MTYyODE1MDA2NywiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIiwianRpIjoiZjY4YTc5OWUtYWVhNC00ZDMwLTkyMDgtNDdiNmMzODlhNjY4In0.6_EqSptsZIirOIMrhYWRyO1E5MawTQpIUFX9gjMM5KA'
    //   }
    // }
  }
}
