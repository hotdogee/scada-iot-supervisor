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
