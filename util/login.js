require('dotenv').config()
const feathers = require('feathers/client')
const socketio = require('feathers-socketio/client')
const hooks = require('feathers-hooks')
const errors = require('feathers-errors') // An object with all of the custom error types.
const auth = require('feathers-authentication-client')
const io = require('socket.io-client')
const config = require('config')
// const Storage = require('dom-storage')
// var localStorage = new Storage('./localStorage.json')
const localStorage = require('node-persist')
localStorage.initSync();
localStorage.setItem = localStorage.setItemSync
localStorage.getItem = localStorage.getItemSync

const socket = io(config.get('supervisor.url'))

const supervisor = feathers()
  .configure(socketio(socket))
  .configure(hooks())
  .configure(auth({
    storage: localStorage
  }))

var email = process.env.USERNAME || 'user@example.com'
var password =  process.env.PASSWORD || 'random!password'
console.log(`User ${email}, Password ${password}`)

supervisor.authenticate({
  strategy: 'local',
  email: email,
  password: password
}).then(token => {
  console.log('User is logged in:', token)
  process.exit()
}).catch(err => console.error('Error occurred:', err))
