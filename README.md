# scada-iot-supervisor

> SCADA/IoT Supervisor System

## Endpoints

https://scada.hanl.in - localhost:8083 - vue frontend
https://scada.hanl.in/api - localhost:8081 - feathers backend
https://scada.hanl.in/media - localhost:8085 - node-media-server
https://line.scada.hanl.in - localhost:8082 - line webhook

## Setup server pm2

cd scada-iot-supervisor
NODE_ENV=production pm2 start npm --name scada-iot-supervisor -- run start

cd ../scada-iot-hmi
NODE_ENV=production pm2 start npm --name scada-iot-hmi -- run start
NODE_ENV=production pm2 start /usr/bin/http-server --name scada-iot-hmi -- ./dist --push-state -c 60 -p 8303 -d false

pm2 save

## About

This project uses a custom modification of @feathers-plus/cli to support:

- StandardJS
- js config files

# Scaffolding

```
# Generate a new service with its model
node ..\..\feathers-plus-cli g service
```

# Services

* blob
  * general storage of files of all types
  * handles interfacing with different file services
  * de-duplication of files with the same hash and mime
  * _id is the concatenation of its hash and mime, `${hash}.${ext}`
  * immutable as a result, folders, metadata, tags should be handled by other services
  * there are three ways of receiving blob data
    1. multipart/form-data.file: single file upload
    2. data.uri: data URI of the blob
    3. data.buffer: raw data buffer of the blob
       data.contentType: MIME type, string: 'image/jpeg'
       data.originalName: string
* images
  * storage of image file types
  * one to one relationship with blob
  * provides image specific functions
    * can specify custom width, height and/or format as GET query params
  * an image can belong to zero or one album
  * an image can have multiple tags
  * an image can have a metadata object
* albums

# API

## blob

POST /blob
{
  type: 'image',
  timestamp: new Date(),
  metadata: {
    name: 'cam1'
  },
  file: stream
}

## images

POST /images
body {
  type: 'camera'
  
}

# MongoDB

```js
$ mongo
use scada-iot
db.logs.getIndexes()
[
        {
                "v" : 2,
                "key" : {
                        "_id" : 1
                },
                "name" : "_id_",
                "ns" : "scada-iot.logs"
        },
        {
                "v" : 2,
                "key" : {
                        "logTime" : -1
                },
                "name" : "logTime_-1",
                "background" : true,
                "ns" : "scada-iot.logs"
        },
        {
                "v" : 2,
                "key" : {
                        "name" : 1,
                        "logTime" : -1
                },
                "name" : "name_1_logTime_-1",
                "ns" : "scada-iot.logs",
                "background" : true
        }
]
db.logs.totalIndexSize()
// scan, slow
db.logs.countDocuments({})
db.logs.explain("executionStats").countDocuments({
  logTime: {
    $gt: new Date('2017-08-07T20:39:30.088Z'),
    $lt: new Date('2019-07-30T23:48:15.223Z')
  }
})
// metadata, fast
db.logs.estimatedDocumentCount({})
db.logs.find({logTime:{$gt:new Date("2017-08-08T20:39:30.088Z")}}).limit(10).count()
db.logs.explain("executionStats").find({logTime:{$gt:new Date("2017-08-08T20:39:30.088Z")}}).hint("logTime_-1").limit(10).count()
```


```js
const app = require('./src/app')
query = {
  logTime: {
    $gt: new Date('2017-08-07T20:39:30.088Z'),
    $lt: new Date('2019-07-30T23:48:15.223Z')
  }
}
// this runs 10s
(async () => {
  const start = new Date()
  console.log(await app.service('logs').Model.countDocuments(query))
  console.log(`runtime: ${new Date() - start}ms`)
})()
// this runs 7s
// > 20691179
// runtime: 6937ms
(async () => {
  const start = new Date()
  console.log(await app.service('logs').Model.find(query).count())
  console.log(`runtime: ${new Date() - start}ms`)
})()
// this runs 10s
(async () => {
  const start = new Date()
  console.log(await app.service('logs').Model.aggregate([
    { $match: query },
    { $count: 'total' }
  ]).toArray())
  console.log(`runtime: ${new Date() - start}ms`)
})()
// this runs 10s
(async () => {
  const start = new Date()
  console.log(await app.service('logs').Model.aggregate([
    { $match: query },
    { "$group": {
        "_id": null,
        "count": { "$sum": 1 }
      }}
  ]).toArray())
  console.log(`runtime: ${new Date() - start}ms`)
})()
// this runs 5ms
// > [ { _id: null, count: 20712866 } ]
// runtime: 5ms
(async () => {
  const start = new Date()
  const db = await app.get('mongoClient')
  const count = (await db.collection('logs.sanitized.1d').aggregate([
    { $match: query },
    { "$group": {
        "_id": null,
        "count": { "$sum": "$count" }
      }}
  ]).toArray())[0].count
  console.log(count)
  console.log(`runtime: ${new Date() - start}ms`)
})()
```
