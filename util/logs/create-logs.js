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
    apiKey: process.env.API_KEY,
    service: 'logs',
    method: 'create',
    dataJson: './rtu1.json' // 'rtu2.json'
  }
})
// logger.debug(`argv`, argv)

const data = require(argv.dataJson)
data.logTime = new Date()
/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    if (!argv.apiKey) throw new Error('apiKey required')
    // const auth = await api.reAuthenticate()
    const auth = await api.authenticate({
      strategy: 'jwt',
      accessToken: argv.apiKey
    })
    // logger.info(`reAuthenticate result =`, auth)
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
