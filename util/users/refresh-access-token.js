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
    logger.debug(`keyPair`, keyPair)
    const { signature, document } = await sign(keyPair, {
      userId: argv.userId
    })
    logger.debug(`{ signature, document }`, { signature, document })
    const data = {
      strategy: argv.strategy,
      signature,
      document
    }
    logger.info(`${argv.service} data =`, data)
    const result = await api[argv.service](data)
    logger.info(`${argv.service} result =`, result)
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
