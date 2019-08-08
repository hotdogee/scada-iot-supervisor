const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const logger = require(path.resolve(__dirname, '../../src/logger'))
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiOrigin: process.env.API_ORIGIN,
    apiPathname: process.env.API_PATHNAME || '',
    service: 'albums',
    method: 'create'
  }
})
const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

const albumNames = ['template']

socket.on('connect', async (connection) => {
  try {
    await Promise.all(
      albumNames.map(async (name) => {
        const result = await api.service(argv.service)[argv.method]({
          name: name,
          deduplication: true
        })
        // albums.create = {
        //   name: 'template',
        //   deduplication: true,
        //   created: '2019-08-06T02:49:58.180Z',
        //   updated: '2019-08-06T02:49:58.180Z',
        //   _id: '5d48ead63717e88e0c1207af'
        // }
        logger.info(`${argv.service}.${argv.method}`, result)
      })
    )
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
