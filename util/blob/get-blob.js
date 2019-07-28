require('dotenv').config({ path: '../../.env' })
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const logger = require('../../src/logger')

const socket = io(process.env.API_URL)
const api = feathers().configure(socketio(socket))

;(async () => {
  try {
    const result = await api.service('blob').get('123123123123')
    logger.info(result)
  } catch (error) {
    logger.error(error)
  }
})()
