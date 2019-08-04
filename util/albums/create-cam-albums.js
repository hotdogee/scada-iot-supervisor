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

const cams = ['cam1', 'cam2', 'cam3', 'cam4']

socket.on('connect', async (connection) => {
  try {
    await Promise.all(
      cams.map(async (name) => {
        const result = await api.service(argv.service)[argv.method]({
          name: name,
          keep: 10
        })
        // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
        logger.info(`${argv.service}.${argv.method}`, result)
      })
    )
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
