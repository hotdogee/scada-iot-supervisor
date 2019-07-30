// node amqp-feathers.js --supervisor=goo.bio:3030 --ampqstr=amqp://localhost
require('dotenv').config({ path: '../../.env' })
const fs = require('fs')
const path = require('path')
const request = require('request')
const blobService = process.env.API_URL + '/blob'
// const req = fs.createReadStream(path.join(__dirname, '/cam1.txt'))
const req = fs.createReadStream(path.join(__dirname, '/cam1.jpg'))
const formData = {
  type: 'image',
  timestamp: new Date().toJSON(),
  'metadata[name]': 'cam1',
  file: req
}
request.post({ url: blobService, formData }, function (err, httpResponse, body) {
  if (err) {
    return console.error('upload failed:', err)
  }
  console.log('Upload successful!  Server responded with:', body)
})
