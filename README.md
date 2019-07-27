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
