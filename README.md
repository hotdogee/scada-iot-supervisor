# scada-iot-supervisor

> SCADA/IoT Supervisor System

## Endpoints

https://scada.hanl.in - localhost:8083 - vue frontend
https://scada.hanl.in/api - localhost:8081 - feathers backend
https://scada.hanl.in/media - localhost:8085 - node-media-server
https://line.scada.hanl.in - localhost:8082 - line webhook

## PM2

NODE_ENV=production pm2 start npm --name scada-iot-supervisor -- run start

cd ../scada-iot-hmi
NODE_ENV=production pm2 start /usr/bin/http-server --name scada-iot-hmi -- ./dist -p 8303 -d false

## Changelog

__0.1.0__

- Initial release

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
