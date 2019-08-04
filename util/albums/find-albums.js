const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const logger = require('../../src/logger')

const socket = io(process.env.API_URL)
const api = feathers().configure(socketio(socket))

;(async () => {
  try {
    const result = await api.service('albums').find({
      query: {
        $limit: 0,
        _id: '123123123123'
      }
    })
    logger.info('albums.find', result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})()
