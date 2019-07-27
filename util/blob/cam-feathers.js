// node amqp-feathers.js --supervisor=goo.bio:3030 --ampqstr=amqp://localhost

const fs = require('fs')
const path = require('path')
const request = require('request')
const blobService = 'http://localhost:6001' + '/blob'
const req = fs.createReadStream(path.join(__dirname, '/cam1.txt'))
const formData = {
  // Pass a simple key-value pair
  type: 'image',
  'metadata[name]': 'cam1',
  timestamp: new Date().toJSON(),
  file: req
}
request.post({ url: blobService, formData }, function (
  err,
  httpResponse,
  body
) {
  if (err) {
    return console.error('upload failed:', err)
  }
  console.log('Upload successful!  Server responded with:', body)
})
