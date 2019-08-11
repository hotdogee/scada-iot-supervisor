# scada-iot-supervisor

> SCADA/IoT Supervisor System

## Endpoints

- https://scada.hanl.in - localhost:8083 - vue frontend
- https://scada.hanl.in/api - localhost:8081 - feathers backend
- https://scada.hanl.in/api2 - localhost:8086 - feathers 4.0 backend
- https://scada.hanl.in/media - localhost:8085 - node-media-server
- https://line.scada.hanl.in - localhost:8082 - line webhook

## Setup server pm2

```bash
$ cd scada-iot-supervisor
$ NODE_ENV=production sudo pm2 start npm --name scada-iot-supervisor -- run start

$ cd /opt/scada-iot/scada-iot-supervisor
$ NODE_ENV=production sudo pm2 start npm --name scada-iot-supervisor2 -- run start

$ cd ../scada-iot-hmi
$ NODE_ENV=production sudo pm2 start npm --name scada-iot-hmi -- run start
$ NODE_ENV=production sudo pm2 start /usr/bin/http-server --name scada-iot-hmi -- ./dist --push-state -c 60 -p 8303 -d false

$ pm2 save
```

## adding first admin user

```bash
$ cd scada-iot-supervisor
# creates a new user and sends a verification email to the given email address
$ node ./util/users/create-user.js --email=admin@example.com --password=random1password --language=en
2019-08-09T22:41:15.844 info      users.create result = { accounts: [ { type: 'email', value: 'admin@example.com' } ], language: 'en', country: 'tw', created: '2019-08-09T14:41:15.799Z', updated: '2019-08-09T14:41:15.799Z', _id: '5d4d860b09b9d13afc6d23ee' } +266ms
# obtain the verification token from the link in the email
$ node ./util/users/patch-verify-email.js --token=eyJhbGciOiJIUzI1NiIsInR5cCI6InZlcmlmeUVtYWlsIn0.eyJpYXQiOjE1NjUzNjE2NzUsImV4cCI6MTU2NTM2MzQ3NSwiYXVkIjoiaG90ZG9nZWVAZ21haWwuY29tIiwiaXNzIjoiaGFubC5pbiIsInN1YiI6IjVkNGQ4NjBiMDliOWQxM2FmYzZkMjNlZSJ9.jJvKuky9XBNnhTengesrZvxij9xBH9tk4RlFxHoK9Xo
2019-08-09T22:52:41.778 info      users.patch { result: 'success' } +0ms
# patch admin authorizations
$ node ./util/users/patch-admin-authorization.js --userId=5d4d860b09b9d13afc6d23ee --org=example.com --role=admin
# refresh access token
$ node ./util/users/refresh-access-token.js --userId=5d4d860b09b9d13afc6d23ee
```

# Scaffolding

```bash
# Generate a new service with its model
node ..\..\feathers-plus-cli g service
```

# Services

- blob
  - general storage of files of all types
  - handles interfacing with different file services
  - de-duplication of files with the same hash and mime
  - \_id is the concatenation of its hash and mime, `${hash}.${ext}`
  - immutable as a result, folders, metadata, tags should be handled by other services
  - there are three ways of receiving blob data
    1. multipart/form-data.file: single file upload
    2. data.uri: data URI of the blob
    3. data.buffer: raw data buffer of the blob
       data.contentType: MIME type, string: 'image/jpeg'
       data.originalName: string
- images
  - storage of image file types
  - one to one relationship with blob
  - provides image specific functions
    - can specify custom width, height and/or format as GET query params
  - an image can belong to zero or one album
  - an image can have multiple tags
  - an image can have a metadata object
- albums

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
}(
  // this runs 10s
  async () => {
    const start = new Date()
    console.log(await app.service('logs').Model.countDocuments(query))
    console.log(`runtime: ${new Date() - start}ms`)
  }
)()(
  // this runs 7s
  // > 20691179
  // runtime: 6937ms
  async () => {
    const start = new Date()
    console.log(
      await app
        .service('logs')
        .Model.find(query)
        .count()
    )
    console.log(`runtime: ${new Date() - start}ms`)
  }
)()(
  // this runs 10s
  async () => {
    const start = new Date()
    console.log(
      await app
        .service('logs')
        .Model.aggregate([{ $match: query }, { $count: 'total' }])
        .toArray()
    )
    console.log(`runtime: ${new Date() - start}ms`)
  }
)()(
  // this runs 10s
  async () => {
    const start = new Date()
    console.log(
      await app
        .service('logs')
        .Model.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ])
        .toArray()
    )
    console.log(`runtime: ${new Date() - start}ms`)
  }
)()(
  // this runs 5ms
  // > [ { _id: null, count: 20712866 } ]
  // runtime: 5ms
  async () => {
    const start = new Date()
    const db = await app.get('mongoClient')
    const count = (await db
      .collection('logs.sanitized.1d')
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            count: { $sum: '$count' }
          }
        }
      ])
      .toArray())[0].count
    console.log(count)
    console.log(`runtime: ${new Date() - start}ms`)
  }
)()
```

# Keys

- [mailjet](https://app.mailjet.com/transactional)
- [reCAPTCHA](https://www.google.com/recaptcha/admin/site/343640963/settings)
- [VAPID](https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user)
  ```bash
  $ npm install -g web-push
  $ web-push generate-vapid-keys
  ```
- [Google OAuth2](https://console.developers.google.com/apis/credentials?project=scada-248614)
- [Facebook OAuth2](https://developers.facebook.com/apps/335907437318058/fb-login/settings/)
- [Twitter OAuth](https://developer.twitter.com/en/apps/16613455)
- [LINE OAuth2](https://developers.line.biz/console/channel/1605624008/basic/)

# References

- [Why do some developers at strong companies like Google consider Agile development to be nonsense?](https://www.quora.com/Why-do-some-developers-at-strong-companies-like-Google-consider-Agile-development-to-be-nonsense/answer/David-Jeske?fbclid=IwAR0PPamL4Ce4JrRHVdWkTUgmI4W8mxH54S143vndeVid8ctZFja-arkxJeE)

## About

This project uses a custom modification of @feathers-plus/cli to support:

- StandardJS
- js config files
