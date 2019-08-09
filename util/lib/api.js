/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { LocalStorage } = require('node-localstorage')
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const auth = require('@feathersjs/authentication-client')
const logger = require('../../src/logger')
/* eslint-enables no-unused-vars */

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiOrigin: process.env.API_ORIGIN,
    apiPathname: process.env.API_PATHNAME || '',
    storagePath: process.env.STORAGE_PATH || './.storage'
  }
})
logger.debug(`argv`, argv)

logger.debug(__dirname)
logger.debug(path.resolve(__dirname, '../../' + argv.storagePath))
const storage = new LocalStorage(
  path.resolve(__dirname, '../../' + argv.storagePath)
)

const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})

const api = feathers()
api.configure(socketio(socket), { timeout: 1000 })
api.configure(
  auth({
    header: 'Authorization',
    scheme: 'Bearer',
    storageKey: 'feathers-jwt',
    locationKey: 'access_token',
    locationErrorKey: 'error',
    jwtStrategy: 'jwt',
    path: '/authentication',
    Authentication: auth.AuthenticationClient,
    storage
  })
)

// handle access token expired
api.hooks({
  error: {
    all: [handleNotAuthenticaticated()]
  }
})

function handleNotAuthenticaticated () {
  // add image to album
  return async (context) => {
    const { app, service, subject, data, params, error } = context
    logger.debug(`context error`, error)
    if (error.name !== 'NotAuthenticated') return context
    const { image } = params
    const { keep } = subject
    // app.info(`patchImages image`, image)
    // app.info(`patchImages subject`, subject)
    if (!image) return context
    data.$push = {
      images: {
        $each: [image],
        $sort: { created: -1 }
      }
    }
    if (keep) {
      data.$push.images.$slice = keep
    }
    return context
  }
}

module.exports = {
  api,
  socket,
  storage
}
