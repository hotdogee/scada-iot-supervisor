/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
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
    service: 'users',
    method: 'patch',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjUyOTYxODIsImV4cCI6MTU2NTI5Nzk4MiwiYXVkIjoiaG90ZG9nZWVAZ21haWwuY29tIiwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGM4NjM2MmNjOTZlOWZiNDY2NzYxOSJ9.ek-rz2t4vGeEjJgfPAZklOl39VxpX_Q8vjkvxJOa6yE'
  }
})
const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
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
