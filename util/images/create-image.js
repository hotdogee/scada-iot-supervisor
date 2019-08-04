// node amqp-feathers.js --supervisor=goo.bio:3030 --ampqstr=amqp://localhost
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const fs = require('fs')
const path = require('path')
const request = require('request')
const service = process.env.API_URL + '/images'
// const req = fs.createReadStream(path.join(__dirname, '/cam1.txt'))
const req = fs.createReadStream(path.join(__dirname, '/cam1.jpg'))
const formData = {
  timestamp: new Date().toJSON(),
  albumId: '5d435c1fb73082687c8797a6',
  file: req
}
request.post({ url: service, formData }, function(err, httpResponse, body) {
  if (err) {
    return console.error('upload failed:', err)
  }
  console.log('Upload successful!  Server responded with:', body)
})
