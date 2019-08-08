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
      'eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjUyOTM1OTEsImV4cCI6MTU2NTI5NTM5MSwiYXVkIjoiaG90ZG9nZWVAZ21haWwuY29tIiwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGM3YzE3YjY4NDM3YTJkMGQ5OGVmOCJ9.dTqIOw01FAuX7GGWxR_5TeGPTmZOQpLCBI9S9UfpNqo'
  }
})
const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

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
