// node .\util\users\create-user.js
// node .\util\users\create-user.js --language=zh-hant

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
const { generateKeyPair, saveKeyPair, sign } = require('../lib/auth')
const { api, socket, storage } = require('../lib/api')

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
// logger.debug(`argv`, argv)

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
    // logger.info(`${argv.service}.${argv.method} data =`, data)
    const result = await api.service(argv.service)[argv.method](data, params)
    // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
    logger.info(`${argv.service}.${argv.method} result =`, result)
    // result = {
    //   accounts: [{ type: 'email', value: 'hotdogee@gmail.com' }],
    //   language: 'en',
    //   country: 'tw',
    //   created: '2019-08-09T14:41:15.799Z',
    //   updated: '2019-08-09T14:41:15.799Z',
    //   _id: '5d4d860b09b9d13afc6d23ee'
    // }
    // save userId
    storage.setItem('user-id', result._id)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
