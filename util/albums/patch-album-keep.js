const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const logger = require(path.resolve(__dirname, '../../src/logger'))
const { api, socket } = require('../lib/api')

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'albums',
    method: 'patch',
    id: '5d40995997207574c0081863'
  }
})

socket.on('connect', async (connection) => {
  try {
    const result = await api.service(argv.service)[argv.method](argv.id, {
      keep: 10
    })
    // { name: 'cam1', _id: '5d40995997207574c0081863' }
    logger.info(`${argv.service}.${argv.method}`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
