// node .\util\users\create-user.js
// node .\util\users\create-user.js --language=zh-hant

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
const { api, socket, storage } = require('../lib/api')

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'users',
    method: 'patch',
    email: 'hotdogee@gmail.com',
    action: 'resend-email-verification',
    userId: null
  }
})
// logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    // access token required
    const auth = await api.reAuthenticate()
    // anonymous user
    const userId = argv.userId || storage.getItem('user-id')
    if (!userId) throw new Error('userId required')
    const data = {
      accounts: [
        {
          type: 'email',
          value: argv.email
        }
      ]
    }
    const params = paramsForServer({
      query: {},
      action: argv.action
    })
    // logger.info(`${argv.service}.${argv.method} data =`, data)
    const result = await api.service(argv.service)[
      // eslint-disable-next-line no-unexpected-multiline
      argv.method
    ](userId, data, params)
    logger.info(`${argv.service}.${argv.method} result =`, result)
    // result = {
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
