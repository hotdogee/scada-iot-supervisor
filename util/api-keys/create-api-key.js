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
    service: 'api-keys',
    method: 'create',
    name: 'geo9-pi3p1'
  }
})
logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    const auth = await api.reAuthenticate()
    logger.info(`reAuthenticate result =`, auth)
    const data = {
      name: argv.name
    }
    const params = paramsForServer({
      query: {}
    })
    const result = await api.service(argv.service)[argv.method](data, params)
    logger.info(`${argv.service}.${argv.method} result =`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})

/* eslint-disable no-unused-vars */
/* eslint-enables no-unused-vars */
