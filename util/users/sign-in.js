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
    service: 'authenticate',
    strategy: 'local',
    email: 'hotdogee@gmail.com',
    password: 'testtesttest'
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
      'accounts.value': argv.email
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
      strategy: argv.strategy,
      'accounts.value': argv.email,
      password: argv.password,
      signature,
      document
    }
    // logger.info(`${argv.service}.${argv.method} data =`, data)
    const result = await api[argv.service](data)
    // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
    logger.info(`${argv.service} result =`, result)
    // result = {
    //   accessToken:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjYxNDIwNTgsImV4cCI6MTU2NjE0MjY1OCwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGQ4NjBiMDliOWQxM2FmYzZkMjNlZSIsImp0aSI6IjM4NTE1NTA1LTA4MDgtNDBmMC1hN2JlLTBhZTdhOTJkODY0ZSJ9.lkyrWqGUbpUyqHlarL3Quc7AFRfmECQ8l-0T_qMrhNw',
    //   authentication: {
    //     strategy: 'local'
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
    //     language: 'en',
    //     country: 'tw',
    //     created: '2019-08-09T14:41:15.799Z',
    //     updated: '2019-08-09T14:52:41.737Z',
    //     authorizations: [
    //       {
    //         org: 'hanl.in',
    //         role: 'admin'
    //       }
    //     ]
    //   }
    // }
    // save userId
    storage.setItem('user-id', result.user._id)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
