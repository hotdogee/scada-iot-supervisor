// node .\util\templates\find-templates.js --language=ZH-CN
// node .\util\templates\find-templates.js --language=zh-hans
// node .\util\templates\find-templates.js --language=zh-ha
// node .\util\templates\find-templates.js --language=zh-
// node .\util\templates\find-templates.js --language=zh
// node .\util\templates\find-templates.js --language=z
// node .\util\templates\find-templates.js --language=en-us
// node .\util\templates\find-templates.js --language=en-uk
// node .\util\templates\find-templates.js --language=en-US
// node .\util\templates\find-templates.js --language=EN-US
// node .\util\templates\find-templates.js --language=En-US
// node .\util\templates\find-templates.js --language=En
// node .\util\templates\find-templates.js --language=ZH-TW
/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const fs = require('fs')
const request = require('request')
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
const { machineId } = require('node-machine-id')
const WebCrypto = require('node-webcrypto-ossl') // this defines global.btoa and global.atob
const webcrypto = new WebCrypto({
  directory: '.keystore'
})
const keyStorage = webcrypto.keyStorage
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiOrigin: process.env.API_ORIGIN,
    apiPathname: process.env.API_PATHNAME || '',
    service: 'templates',
    method: 'find',
    type: 'email',
    name: 'email-verification',
    language: 'en', // ['en', 'zh-hant']
    fallbackLanguage: true
  }
})
logger.debug(`argv`, argv)

const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

/* eslint-enables no-unused-vars */
;(async () => {
  try {
    const params = paramsForServer({
      query: {
        type: argv.type,
        name: argv.name,
        language: argv.language
      },
      fallbackLanguage: argv.fallbackLanguage
    })
    const result = await api.service(argv.service)[argv.method](params)
    logger.info(`${argv.service}.${argv.method} result =`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})()
