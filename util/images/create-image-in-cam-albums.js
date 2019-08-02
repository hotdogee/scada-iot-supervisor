// node amqp-feathers.js --supervisor=goo.bio:3030 --ampqstr=amqp://localhost
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const logger = require(path.resolve(__dirname, '../../src/logger'))
const fs = require('fs')
const request = require('request')
const service = process.env.API_URL + '/images'
// const req = fs.createReadStream(path.join(__dirname, '/cam1.txt'))
const albumIds = [
  '5d435c1fb73082687c8797a5',
  '5d435c1fb73082687c8797a6',
  '5d435c1fb73082687c8797a7',
  '5d435c1fb73082687c8797a8'
]

albumIds.forEach(async (albumId) => {
  const req = fs.createReadStream(path.join(__dirname, '/cam1.jpg'))
  const formData = {
    timestamp: new Date().toJSON(),
    albumId,
    file: req
  }
  logger.info(albumId)
  await new Promise((resolve, reject) => {
    request.post({ url: service, formData }, function (err, httpResponse, body) {
      if (err) {
        logger.error('upload failed:', err)
        reject(err)
      }
      logger.log('Upload successful!  Server responded with:', body)
      resolve(body)
    })
  })
})
