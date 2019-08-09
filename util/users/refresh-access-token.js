// node .\util\users\create-user.js
// node .\util\users\create-user.js --language=zh-hant

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const logger = require('../../src/logger')
const { readKeyPair, sign } = require('../lib/auth')
const { api, socket } = require('../lib/api')
const serializeError = require('serialize-error')
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'authenticate',
    strategy: 'ecdsa',
    userId: '5d4c86362cc96e9fb4667619'
  }
})
logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    const keyPair = readKeyPair()
    // logger.debug(`keyPair`, keyPair)
    const { signature, document } = await sign(keyPair, {
      userId: argv.userId
    })
    // logger.debug(`{ signature, document }`, { signature, document })
    // {
    //   signature:
    //     'bnGfjyG7m6YtUFmbHBMrBI5NCg9MxWcgdrmvqi3jO1EvnFStlBtH0Ei6YbAelaKSkdCjCXmDq2iS4DSKJOI4bw==',
    //   document: {
    //     payload: { userId: '5d4c86362cc96e9fb4667619' },
    //     publicKey:
    //       '{"kty":"EC","crv":"P-256","key_ops":["verify"],"x":"vYSJ8JWZkWCI0gUz6dZFoVbWIR-VV8kUZ0LiAPXrZrI","y":"VZUAzGBkAcLhrqZvJYtqrBrmZNz6jXxZLKIu932odWM"}',
    //     timestamp: '2019-08-09T11:02:27.827Z',
    //     userAgent:
    //       'bfdaca43d47406f301471f211210fce990269efbcc7c363ea9e2a11d0ab98ad5'
    //   }
    // }
    const data = {
      strategy: argv.strategy,
      signature,
      document
    }
    // logger.info(`${argv.service} data =`, data)
    // const data = {
    //   strategy: 'ecdsa',
    //   signature:
    //     'bnGfjyG7m6YtUFmbHBMrBI5NCg9MxWcgdrmvqi3jO1EvnFStlBtH0Ei6YbAelaKSkdCjCXmDq2iS4DSKJOI4bw==',
    //   document: {
    //     payload: { userId: '5d4c86362cc96e9fb4667619' },
    //     publicKey:
    //       '{"kty":"EC","crv":"P-256","key_ops":["verify"],"x":"vYSJ8JWZkWCI0gUz6dZFoVbWIR-VV8kUZ0LiAPXrZrI","y":"VZUAzGBkAcLhrqZvJYtqrBrmZNz6jXxZLKIu932odWM"}',
    //     timestamp: '2019-08-09T11:02:27.827Z',
    //     userAgent:
    //       'bfdaca43d47406f301471f211210fce990269efbcc7c363ea9e2a11d0ab98ad5'
    //   }
    // }
    const result = await api[argv.service](data)
    logger.info(`${argv.service} result =`, result)
    // const result = {
    //   accessToken:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNDg1NDcsImV4cCI6MTU2NTM1MDM0NywiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGM4NjM2MmNjOTZlOWZiNDY2NzYxOSIsImp0aSI6IjkyMjdlOTBlLTA0MzEtNDI0Zi1hMzJjLWU4Y2MwNGRkYmFhMCJ9.lG0vWbsiguE_7ynYCNHZAWeh1aHlS4J6m03RyqnHrzU',
    //   authentication: { strategy: 'ecdsa' },
    //   user: {
    //     _id: '5d4c86362cc96e9fb4667619',
    //     accounts: [
    //       {
    //         type: 'email',
    //         value: 'hotdogee@gmail.com',
    //         verified: '2019-08-08T20:32:27.430Z'
    //       }
    //     ],
    //     language: 'en',
    //     country: 'tw',
    //     created: '2019-08-08T20:29:42.713Z',
    //     updated: '2019-08-08T20:32:27.431Z',
    //     authorizations: [{ org: 'hanl.in', role: 'admin' }]
    //   }
    // }
  } catch (error) {
    logger.error(error)
    // {
    //   name: 'TypeError',
    //   message: 'api[argv.service] is not a function',
    //   stack:
    //     'TypeError: api[argv.service] is not a function\n    at Socket.<anonymous> (C:\\Users\\Hotdogee\\Dropbox\\Work\\scada-iot\\next\\scada-iot-supervisor\\util\\users\\refresh-access-token.js:36:43)'
    // }
  } finally {
    process.exit()
  }
})
