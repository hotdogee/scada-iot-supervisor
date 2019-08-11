// node .\util\images\find-images.js

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { api, socket } = require('../lib/api')
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiKey: process.env.API_KEY,
    service: 'images',
    method: 'find'
  }
})
// logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    // if (!argv.apiKey) throw new Error('apiKey required')
    // const auth = await api.authenticate({
    //   strategy: 'jwt',
    //   accessToken: argv.apiKey
    // })
    // logger.info(`authenticate result =`, auth)
    const params = paramsForServer({
      query: {
        $limit: 500,
        $select: ['_id']
      }
    })
    const result = await api.service(argv.service)[argv.method](params)
    logger.info(`${argv.service}.${argv.method} result =`, result, {
      ids: result.data
    })
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})

/* eslint-disable no-unused-vars */
/* eslint-enables no-unused-vars */
