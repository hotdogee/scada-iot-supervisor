// localhost
// node ./util/templates/create-password-reset-templates.js --albumId=5d48ead63717e88e0c1207af
// api2
// node ./util/templates/create-password-reset-templates.js --albumId=5d506e0edcb7d22aa7057a84

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const fs = require('fs')
const request = require('request')
const logger = require('../../src/logger')
const { api, socket } = require('../lib/api')

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'templates',
    method: 'create',
    type: 'email',
    // language: ['en', 'zh-hant'],
    albumId: '5d506e0edcb7d22aa7057a84'
  }
})
// logger.debug(`argv`, argv)

const imagesService =
  process.env.API_ORIGIN + process.env.API_PATHNAME + '/images'

// logo public link: "https://i.imgur.com/ycc0EJC.gif"

/* eslint-enables no-unused-vars */
const templates = [
  {
    type: argv.type,
    name: 'password-reset',
    language: 'en',
    content: {
      subject: `[SCADA/IoT] Password Reset`,
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
    name: 'password-reset',
    language: 'zh-hant',
    content: {
      subject: `[蘭陽地熱] 重設密碼`,
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
    name: 'attempted-password-reset',
    language: 'en',
    content: {
      subject: `[SCADA/IoT] Attempted Password Reset`,
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
    name: 'attempted-password-reset',
    language: 'zh-hant',
    content: {
      subject: `[蘭陽地熱] 試圖重設密碼`,
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
    // eslint-disable-next-line no-unused-vars
    const auth = await api.reAuthenticate()
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
            request.post(
              {
                url: imagesService,
                formData,
                json: true,
                auth: { bearer: auth.accessToken }
              },
              function (err, res, body) {
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
              }
            )
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
