// node .\util\users\create-user.js
// node .\util\users\create-user.js --language=zh-hant

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { api, socket } = require('../lib/api')
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'api-key',
    method: 'create'
  }
})
logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
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
/* eslint-enables no-unused-vars */
