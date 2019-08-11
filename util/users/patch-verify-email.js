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
    token: null
  }
})

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    if (!argv.token) throw new Error('token required')
    const result = await api.service(argv.service)[argv.method](
      null,
      {},
      paramsForServer({
        token: argv.token
      })
    )
    //
    logger.info(`${argv.service}.${argv.method}`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
