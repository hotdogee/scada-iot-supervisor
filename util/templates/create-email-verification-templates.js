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
    method: 'create',
    type: 'email',
    name: 'email-verification',
    language: ['en', 'zh-hant'],
    albumId: '5d48ead63717e88e0c1207af'
  }
})
logger.debug(`argv`, argv)

const imagesService = process.env.API_URL + '/images'

const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

// logo public link: "https://i.imgur.com/ycc0EJC.gif"

/* eslint-enables no-unused-vars */
const templates = [
  {
    type: argv.type,
    name: argv.name,
    language: 'en',
    content: {
      subject: `[SCADA/IoT] Email verification`,
      html: {
        type: 'pug',
        localKeys: ['url', 'complaintEmail']
      },
      encoding: 'utf-8',
      attachments: [
        {
          imagePath: path.join(__dirname, 'logo-email-256.gif'),
          cid: 'logo'
        }
      ]
    }
  },
  {
    type: argv.type,
    name: argv.name,
    language: 'zh-hant',
    content: {
      subject: `[蘭陽地熱] 電子郵件驗證信`,
      html: {
        type: 'pug',
        localKeys: ['url', 'complaintEmail']
      },
      encoding: 'utf-8',
      attachments: [
        {
          imagePath: path.join(__dirname, 'logo-email-256.gif'),
          cid: 'logo'
        }
      ]
    }
  }
]

socket.on('connect', async (connection) => {
  try {
    for (const t of templates) {
      // read pug
      t.content.html.content = await new Promise((resolve, reject) => {
        let data = ''
        const stream = fs.createReadStream(
          path.join(__dirname, `${t.name}-${t.language}.${t.content.html.type}`)
        )
        stream.on('data', (chunk) => (data += chunk))
        stream.on('end', () => resolve(data))
        stream.on('error', (error) => reject(error))
      })
      // upload images
      t.content.attachments = await Promise.all(
        t.content.attachments.map(async (a) => {
          const file = fs.createReadStream(a.imagePath)
          const formData = {
            timestamp: new Date().toJSON(),
            albumId: argv.albumId,
            file
          }
          a.imageId = await new Promise((resolve, reject) => {
            request.post({ url: imagesService, formData, json: true }, function (
              err,
              httpResponse,
              body
            ) {
              if (err) {
                return console.error('upload failed:', err)
              }
              // console.log('Upload successful!  Server responded with:', body)
              // const body = {
              //   timestamp: '2019-08-08T05:24:27.371Z',
              //   albumId: '5d435c1fb73082687c8797a6',
              //   key:
              //     'd9e7b9a1e96caf7247c211bc754e82993e4aa54439bed4237b0733659680f369.jpeg',
              //   created: '2019-08-08T05:24:27.791Z',
              //   updated: '2019-08-08T05:24:27.791Z',
              //   _id: '5d4bb20b7541b581783474dc'
              // }
              // logger.info(`${a.imagePath} body =`, { body })
              resolve(body._id)
            })
          })
          delete a.imagePath
          return a
        })
      )
      // logger.info(`${argv.service}.${argv.method} data =`, t)
      const result = await api.service(argv.service)[argv.method](t)
      logger.info(`${argv.service}.${argv.method} result =`, result)
    }
    // logger.info(`${argv.service}.${argv.method} result =`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
