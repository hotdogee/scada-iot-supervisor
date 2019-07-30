require('dotenv').config({ path: '../../.env' })
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiOrigin: process.env.API_ORIGIN,
    apiPathname: process.env.API_PATHNAME || '',
    service: 'albums',
    method: 'patch',
    id: '5d40995997207574c0081863'
  }
})
const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

socket.on('connect', async (connection) => {
  try {
    const result = await api.service(argv.service)[argv.method](
      argv.id,
      {},
      paramsForServer({
        image: {
          imageId: '123456789123',
          created: new Date()
        }
      })
    )
    // { name: 'cam1', _id: '5d40995997207574c0081863' }
    logger.info(`${argv.service}.${argv.service}`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
