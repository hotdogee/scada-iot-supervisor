const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
// const hooks = require('feathers-hooks')
// const errors = require('feathers-errors') // An object with all of the custom error types.
// const auth = require('feathers-authentication-client')
const io = require('socket.io-client')
const config = require('config')
const winston = require('winston')
const logger = new winston.createLogger({
  transports: [
    new winston.transports.Console({
      // setup console logging with timestamps
      level: 'debug',
      timestamp: function () {
        return new Date().toISOString()
      },
      formatter: function (options) {
        return (
          options.timestamp() +
          ' ' +
          options.level[0].toUpperCase() +
          ' ' +
          (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta, null, 2) : '')
        )
      }
    })
  ]
})
// const Storage = require('dom-storage')
// var localStorage = new Storage('./localStorage.json')
// const localStorage = require('node-persist')
// // setup localStorage
// localStorage.initSync()
// localStorage.setItem = localStorage.setItemSync
// localStorage.getItem = localStorage.getItemSync

const host = config.get('host')
const port = config.get('port')
const ioConfig = { url: `http://${host}:${port}`, options: {} } // Updated ioConfig with host and port
logger.info(`Connecting to feathers server: ${ioConfig.url}`)
const socket = io(ioConfig.url, ioConfig.options)

const supervisor = feathers().configure(socketio(socket))

// console.log(localStorage.getItem('feathers-jwt'))
// run login.js first to save jwt to localStorage
// supervisor.service('users').find().then(results => logger.info('Users: ', results))

;(async function (supervisor) {
  try {
    // get logs
    const logs = supervisor.service('logs')
    const params = {
      query: {
        $limit: 10,
        $select: ['logTime'], // return only the id field
        $sort: {
          logTime: -1
        }
        // logTime: {
        //   $gt: new Date((new Date().getTime() - 1*60*1000)).toISOString() // find all logs within 1 minute
        // }
      }
    }
    const start = new Date()
    const results = await logs.find(params)
    const elapsed = new Date() - start
    logger.info('Logs: ', results)
    logger.info(`Elapsed: ${elapsed} ms`)
  } catch (error) {
    console.error('logs.find:', error)
  } finally {
    process.exit()
  }
})(supervisor)
