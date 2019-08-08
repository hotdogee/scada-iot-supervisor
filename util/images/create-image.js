// node amqp-feathers.js --supervisor=goo.bio:3030 --ampqstr=amqp://localhost
/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const fs = require('fs')
const request = require('request')
const service = process.env.API_URL + '/images'
// const req = fs.createReadStream(path.join(__dirname, '/cam1.txt'))
const req = fs.createReadStream(path.join(__dirname, '/cam1.jpg'))
const formData = {
  timestamp: new Date().toJSON(),
  albumId: '5d435c1fb73082687c8797a6',
  file: req
}
/* eslint-enables no-unused-vars */
request.post({ url: service, formData }, function (err, httpResponse, body) {
  if (err) {
    return console.error('upload failed:', err)
  }
  console.log('Upload successful!  Server responded with:', body)
  // const body = {
  //   timestamp: '2019-08-08T05:24:27.371Z',
  //   albumId: '5d435c1fb73082687c8797a6',
  //   key:
  //     'd9e7b9a1e96caf7247c211bc754e82993e4aa54439bed4237b0733659680f369.jpeg',
  //   created: '2019-08-08T05:24:27.791Z',
  //   updated: '2019-08-08T05:24:27.791Z',
  //   _id: '5d4bb20b7541b581783474dc'
  // }
})
