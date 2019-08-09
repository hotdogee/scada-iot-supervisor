// node .\util\users\create-user.js
// node .\util\users\create-user.js --language=zh-hant

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
const { generateKeyPair, saveKeyPair, sign } = require('../lib/auth')
const WebCrypto = require('node-webcrypto-ossl') // this defines global.btoa and global.atob
const webcrypto = new WebCrypto({
  directory: '.keystore'
})
const keyStorage = webcrypto.keyStorage
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiOrigin: process.env.API_ORIGIN,
    apiPathname: process.env.API_PATHNAME || '',
    service: 'users',
    method: 'create',
    email: 'hotdogee@gmail.com',
    password: 'testtesttest',
    language: 'en', // 'zh-hant'
    country: 'tw'
  }
})
logger.debug(`argv`, argv)

const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    const keyPair = await generateKeyPair()
    // logger.debug(`keyPair`, keyPair)
    // keyPair = {
    //   privateKey: {
    //     usages: ['sign'],
    //     native_: { type: 408 },
    //     extractable: false,
    //     algorithm: { name: 'ECDSA', namedCurve: 'P-256' },
    //     type: 'private'
    //   },
    //   publicKey: {
    //     usages: ['verify'],
    //     native_: { type: 408 },
    //     extractable: true,
    //     algorithm: { name: 'ECDSA', namedCurve: 'P-256' },
    //     type: 'public'
    //   }
    // }
    saveKeyPair(keyPair)
    const { signature, document } = await sign(keyPair, {
      email: argv.email
    })
    // logger.debug(`{ signature, document }`, { signature, document })
    // { signature, document } = {
    //   signature:
    //     'lfhaI1s9wIYaN6cAsQPqVQCchCoP5DXckMMrQdy0NOHKpu/ZgJajTNUxyJ3bzjUZGQ6SvtHRmlNJ71lBHdEPqw==',
    //   document: {
    //     payload: { email: 'hotdogee@gmail.com' },
    //     publicKey:
    //       '{"kty":"EC","crv":"P-256","key_ops":["verify"],"x":"wcJfNjTYkF5mnKH7HYYznuWuyEIMHOVDCCGVZ_EutL8","y":"mdzAxu5dyxC09BX6WFHCztb657PSdENBYszEKQJIGhE"}',
    //     timestamp: '2019-08-04T17:05:56.269Z',
    //     userAgent:
    //       'bfdaca43d47406f301471f211210fce990269efbcc7c363ea9e2a11d0ab98ad5'
    //   }
    // }
    const data = {
      accounts: [
        {
          type: 'email',
          value: argv.email
        }
      ],
      password: argv.password,
      language: argv.language,
      country: argv.country
    }
    const params = paramsForServer({
      query: {},
      signature,
      document
    })
    logger.info(`${argv.service}.${argv.method} data =`, data)
    const result = await api.service(argv.service)[argv.method](data, params)
    // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
    logger.info(`${argv.service}.${argv.method} result =`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})

/* eslint-disable no-unused-vars */
async function generateKeyExplore () {
  const key = await webcrypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256' // can be 'P-256', 'P-384', or 'P-512'
    },
    true, // whether the key is extractable (i.e. can be used in exportKey)
    ['sign', 'verify']
  )
  /**
   * saving private RSA key to KeyStorage
   * creates file ./key_storage/prvRSA-1024.json
   */
  // keyStorage.setItem("prvRSA-1024", keyPairs.privateKey);
  // console.log(keyPairs)
  // console.log(keyPairs.privateKey)
  // console.log(keyPairs.publicKey)
  // CryptoKey {
  //   usages: [ 'sign' ],
  //   native_: Key { type: 408 },
  //   extractable: false,
  //   algorithm: { name: 'ECDSA', namedCurve: 'P-256' },
  //   type: 'private'
  // }
  // CryptoKey {
  //   usages: [ 'verify' ],
  //   native_: Key { type: 408 },
  //   extractable: true,
  //   algorithm: { name: 'ECDSA', namedCurve: 'P-256' },
  //   type: 'public'
  // }

  const jwk = await webcrypto.subtle.exportKey(
    'jwk', // can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
    key.publicKey // can be a publicKey or privateKey, as long as extractable was true
  )
  console.log(`publicKey`, jwk)
  // publicKey {
  //   kty: 'EC',
  //   crv: 'P-256',
  //   key_ops: [ 'verify' ],
  //   x: '-eGGqhymn8iL3ogA3UqNiXZmBfBLqFJhwXALwC7qgz0',
  //   y: 'dY_tapL4n6CbxZNRRagYE9JnCg9AN-kWekmQEUdvzv4'
  // }

  const jwk2 = await webcrypto.subtle.exportKey(
    'jwk', // can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
    key.privateKey // can be a publicKey or privateKey, as long as extractable was true
  )
  console.log(`privateKey`, jwk2)
  // privateKey {
  //   kty: 'EC',
  //   crv: 'P-256',
  //   key_ops: [ 'sign' ],
  //   x: '-eGGqhymn8iL3ogA3UqNiXZmBfBLqFJhwXALwC7qgz0',
  //   y: 'dY_tapL4n6CbxZNRRagYE9JnCg9AN-kWekmQEUdvzv4',
  //   d: 'LHwHF8aPlkt0KZ9LsnRkS_Epxk28ucCWD4m2ulWZqoA'
  // }
  keyStorage.setItem('ECDSA1publicKey', key.publicKey)
  // {
  //   "algorithm": { "name": "ECDSA", "namedCurve": "P-256" },
  //   "usages": ["verify"],
  //   "type": "public",
  //   "keyJwk": {
  //     "kty": "EC",
  //     "crv": 415,
  //     "x": "+eGGqhymn8iL3ogA3UqNiXZmBfBLqFJhwXALwC7qgz0=",
  //     "y": "dY/tapL4n6CbxZNRRagYE9JnCg9AN+kWekmQEUdvzv4="
  //   },
  //   "name": "ECDSA1publicKey",
  //   "extractable": true
  // }

  keyStorage.setItem('ECDSA1privateKey', key.privateKey)
  // {
  //   "algorithm": { "name": "ECDSA", "namedCurve": "P-256" },
  //   "usages": ["sign"],
  //   "type": "private",
  //   "keyJwk": {
  //     "kty": "EC",
  //     "crv": 415,
  //     "x": "+eGGqhymn8iL3ogA3UqNiXZmBfBLqFJhwXALwC7qgz0=",
  //     "y": "dY/tapL4n6CbxZNRRagYE9JnCg9AN+kWekmQEUdvzv4=",
  //     "d": "LHwHF8aPlkt0KZ9LsnRkS/Epxk28ucCWD4m2ulWZqoA="
  //   },
  //   "name": "ECDSA1privateKey",
  //   "extractable": true
  // }

  // keyStorage.setItem('ECDSA1key', key) // error
  const key2 = await webcrypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256' // can be 'P-256', 'P-384', or 'P-512'
    },
    false, // whether the key is extractable (i.e. can be used in exportKey)
    ['sign', 'verify']
  )
  const jwk3 = await webcrypto.subtle.exportKey(
    'jwk', // can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
    key2.publicKey // can be a publicKey or privateKey, as long as extractable was true
  )
  console.log(`publicKey`, jwk3)
  keyStorage.setItem('ECDSA2publicKey', key2.publicKey)
  keyStorage.setItem('ECDSA2privateKey', key2.privateKey)
}
// generateKeyExplore()
/* eslint-enables no-unused-vars */
