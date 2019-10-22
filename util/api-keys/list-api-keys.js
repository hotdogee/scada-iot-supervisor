// node .\util\api-keys\create-api-key.js --name=geo9-pi3p1
// node .\util\api-keys\create-api-key.js --name=geo9-pi3p2

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
    method: 'find',
    name: 'geo9-pi3p1'
  }
})
// logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    const auth = await api.reAuthenticate()
    // logger.info(`reAuthenticate result =`, auth)
    const params = {
      query: {}
    }
    const result = await api.service(argv.service)[argv.method](params)
    logger.info(`${argv.service}.${argv.method} result =`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})

/* eslint-disable no-unused-vars */
/* eslint-enables no-unused-vars */
