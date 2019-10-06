// node .\util\images\find-images.js

/* eslint-disable no-unused-vars */
const path = require('path')
// require('dotenv').config({ path: path.resolve(__dirname, '../../.env.api2') })
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
// logger.debug(`process.env`, process.env)

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
        timestamp: {
          // $gt: new Date('2019-10-06T12:52:37.921Z').getTime()
          $lt: new Date('2019-10-06T12:52:37.921Z')
        },
        // timestamp: '2019-08-18T15:30:50.711Z',
        $limit: 3
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

// node -r dotenv/config .\util\images\find-images-query-timestamp.js dotenv_config_path=.\env.api2
// node .\util\images\find-images-query-timestamp.js
