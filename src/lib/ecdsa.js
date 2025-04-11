const safeStringify = require('fast-safe-stringify')
const debug = require('debug')('lib.ecdsa')
// const WebCrypto = require('node-webcrypto-ossl')
// const webcrypto = new WebCrypto()
const { subtle } = globalThis.crypto

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

// requried data: signed, signature
exports.verify = async function(
  signature,
  document,
  msAge = 30000, // needs to have been signed within 30 secs
  format = 'jwk',
  importParams = {
    // a dictionary object defining the type of key to import
    // and providing extra algorithm-specific parameters
    name: 'ECDSA',
    namedCurve: 'P-256' // can be 'P-256', 'P-384', or 'P-512'
  },
  verifyParams = {
    // a dictionary object defining the algorithm to use
    // and providing extra algorithm-specific parameters
    name: 'ECDSA',
    hash: { name: 'SHA-256' } // can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
  },
  expiredError = new BadRequest({
    message: `ECDSA signature expired`
  })
  // invalidError = new BadRequest({
  //   message: `ECDSA signature verification failed`
  // })
) {
  // const authentication = {
  //   strategy: 'ecdsa',
  //   signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
  //   signed: {
  //     payload: {
  //       userId: state.user._id
  //     },
  //     publicKey: JSON.stringify(publicKey),
  //     timestamp: new Date(),
  //     // timestamp: new Date('2018-11-06T07:34:20.671Z'),
  //     userAgent: navigator.userAgent
  //     // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36"
  //   }
  // }
  // check signature freshness
  debug(`verifyECDSA signed.timestamp = ${document.timestamp}`)
  if (new Date() - new Date(document.timestamp) > msAge) {
    throw expiredError
  }
  const publicKey = await subtle.importKey(
    format, // can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
    JSON.parse(document.publicKey),
    importParams,
    true, // whether the key is extractable (i.e. can be used in exportKey)
    ['verify'] // 'verify' for public key import, 'sign' for private key imports
  )
  debug(`verifyECDSA publicKey = ${safeStringify(publicKey)}`)
  const sigBuffer = Buffer.from(signature, 'base64')
  debug(
    `verifyECDSA sigBuffer(${sigBuffer.byteLength}) = ${new Uint8Array(
      sigBuffer
    )}`
  )
  const docBuffer = Buffer.from(safeStringify(document), 'utf8')
  debug(`verifyECDSA docBuffer = ${docBuffer}`)
  const valid = await subtle.verify(
    verifyParams,
    publicKey, // from generateKey or importKey above
    sigBuffer, // ArrayBuffer of the signature
    docBuffer // ArrayBuffer of the data
  )
  debug(`verifyECDSA valid = ${valid}`)
  // if (!valid) {
  //   throw invalidError
  // }
  return valid
}
