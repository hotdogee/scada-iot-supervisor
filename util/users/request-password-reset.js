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
    service: 'users',
    method: 'create',
    email: 'hotdogee@gmail.com',
    action: 'request-password-reset',
    language: 'en' // 'zh-hant'
  }
})
// logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    // anonymous user
    const data = {
      accounts: [
        {
          type: 'email',
          value: argv.email
        }
      ],
      language: argv.language
    }
    const params = paramsForServer({
      query: {},
      action: argv.action
    })
    // logger.info(`${argv.service}.${argv.method} data =`, data)
    const result = await api.service(argv.service)[argv.method](data, params)
    logger.info(`${argv.service}.${argv.method} result =`, result)
    // result = {
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
