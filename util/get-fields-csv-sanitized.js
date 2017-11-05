require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
const config = require('config')
const _ = require('lodash')

const winston = require('winston')
const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        // setup console logging with timestamps
        level: 'debug',
        timestamp: function() {
          return (new Date()).toISOString()
        },
        formatter: function(options) {
          return options.timestamp() + ' ' + options.level[0].toUpperCase() + ' ' + (options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta, null, 2) : '' );
        }
      })
    ]
});

// cross-env MONGODB=mongodb://localhost:27017/scada-iot-20171105 node .\util\get-fields-csv-sanitized.js
let promise = null
// output to csv dir one file each day
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(async db => {
  // intervel
  const intervel = 60 * 60 * 24 * 1000 // 1d
  const timezoneOffset = -60 * new Date().getTimezoneOffset() * 1000
  // get start and end
  const bucket = '1ms'
  const logs = db.collection(`logs.sanitized.${bucket}`)
  const firstLogTime = (await logs.find().sort({ logTime: 1 }).limit(1).next()).logTime
  const lastLogTime = (await logs.find().sort({ logTime: -1 }).limit(1).next()).logTime
  logger.info(`firstLogTime ${firstLogTime}, lastLogTime ${lastLogTime}`)
  // get csv fields
  promise = db.collection(`logs.sanitized.1d`).aggregate([
    { $project: {
      kv: {
        $concatArrays: [ { $objectToArray: "$$ROOT" }, { $objectToArray: "$reads" } ]
      }
    }},
    { $unwind: "$kv"},
    { $group: {
      _id: "$kv.k"
    }},
    { $sort : { _id : 1 } },
    { $group: {
      _id: null,
      fields: {
        $push: "$_id"
      }
    }},
  ]).toArray().then(docs => {
    logger.info(docs)
    db.close()
  })
})

// currentLog =
// {
//   "_id": "5997b0a66280a1595505357e",
//   "name": "Geo9",
//   "logTime": "2017-08-19T02:25:31.487Z",
//   "reads": [
//     {
//       "name": "九號井口",
//       "addr": 1,
//       "reads": [
//         {
//           "name": "溫度",
//           "unit": "℃",
//           "value": 176.74302673339844,
//           "time": "2017-08-19T02:25:29.297Z"
//         }
//       ]
//     },
//     {
//       "name": "手動閘閥前",
//       "addr": 2,
//       "reads": [
//         {
//           "name": "壓力",
//           "unit": "bar",
//           "value": 4.784983158111572,
//           "time": "2017-08-19T02:25:29.393Z"
//         },
//         {
//           "name": "溫度",
//           "unit": "℃",
//           "value": 146.62693786621094,
//           "time": "2017-08-19T02:25:29.393Z"
//         }
//       ]
//     },
//     {
//       "name": "發電機1",
//       "addr": 63,
//       "reads": [
//         {
//           "name": "三相功率",
//           "unit": "kW",
//           "value": 6.8004150390625,
//           "time": "2017-08-19T02:25:30.064Z"
//         },
