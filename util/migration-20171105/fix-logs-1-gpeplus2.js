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

let bulkOps = []
let bulkOpsPromises = []
let index = 0
let opsPerBatch = 10000
let finishedOps = 0
// TODO: 2017-11-02 05:56:01.037 前的流量要-2 tph (2017-11-01T21:56:01.037Z)
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(db => {
  const logs = db.collection('logs')
  logs.find({ reads: { $elemMatch: { reads: { $elemMatch: { name: "質量流率", time: { $lte: new Date('2017-11-01T21:56:11.037Z') } } } } } }).forEach((doc) => {
    const operation = {
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {}
        }
      }
    }
    _.forEach(doc.reads, (rtu, i) => {
      _.forEach(rtu.reads, (reg, j) => {
        if (!rtu || ! reg || !rtu.name || !reg.name) {
          console.log(doc._id)
        } else {
          if (reg.name === '質量流率') {
            operation.updateOne.update.$set[`reads.${i}.reads.${j}.value`] = reg.value - 2.0
          }
        }
      })
    })
    // console.log(JSON.stringify(operation, null, 2))
    if (!_.isEmpty(operation.updateOne.update.$set)) {
      bulkOps.push(operation)
    }
    if (bulkOps.length >= opsPerBatch) {
      const promise = logs.bulkWrite(bulkOps).then(result => {
        if (result.writeErrors) {
          console.log(JSON.stringify(result.writeErrors, null, 2))
        }
        finishedOps += opsPerBatch
        console.log(`finished: ${finishedOps}`)
      })
      bulkOpsPromises.push(promise)
      bulkOps = []
    }
  }, async (err) => {
    if (!_.isEmpty(bulkOps)) {
      const promise = logs.bulkWrite(bulkOps).then(result => {
        if (result.writeErrors) {
          console.log(JSON.stringify(result.writeErrors, null, 2))
        }
        finishedOps += bulkOps.length
        console.log(`finished: ${finishedOps}`)
        // {
        //   "ok": 1,
        //   "writeErrors": [],
        //   "writeConcernErrors": [],
        //   "insertedIds": [],
        //   "nInserted": 0,
        //   "nUpserted": 0,
        //   "nMatched": 6741,
        //   "nModified": 6741,
        //   "nRemoved": 0,
        //   "upserted": []
        // }
      })
      bulkOpsPromises.push(promise)
    }
    Promise.all(bulkOpsPromises).then(results => {
      console.log('All done')
      db.close()
    })
  })
})

// TODO: 三相功率>32000 -> 0
// { "reads": { $elemMatch: { "reads": { $elemMatch: { "unit": "kW", "value": { $gt: 30000 } } } } } }
// TODO: 溫度單位°C -> ℃
// TODO: 一開始錯誤特高溫度
// { "reads": { $elemMatch: { "reads": { $elemMatch: { $or: [ { "value": { $gt: 30000 } }, { "value": -1 }, { "unit": "°C" }, { "name": "溫度", "value": { $gt: 300 } } ] } } } } }
// TODO: Hz===-1 -> null
// TODO: 修正質量流率

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
