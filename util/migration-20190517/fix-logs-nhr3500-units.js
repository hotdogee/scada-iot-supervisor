// cross-env MONGODB=mongodb://localhost:27017/scada-iot-20190514 node .\util\migration-20190517\fix-logs-nhr3500-units.js
// 2019-05-19T06:13:25.046Z I Using: mongodb://localhost:27017/scada-iot-20190514
// 2019-05-19T06:14:23.257Z I finished: 10000
// 2019-05-19T06:15:16.369Z I finished: 16987
// 2019-05-19T06:15:16.370Z I All done

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
// FIXES: RTUs ADDR = 72 or 73, before date: ?
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(db => {
  const logs = db.collection('logs')
  logs.find({ reads: { $elemMatch: { addr: { $in: [ 72, 73 ] } } } }).forEach((doc) => {
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
          logger.warn(doc._id)
        } else {
          if (reg.name === '頻率' && reg.unit === '%') {
            operation.updateOne.update.$set[`reads.${i}.reads.${j}.unit`] = 'Hz'
          } else if (reg.unit === 'kW') {
            operation.updateOne.update.$set[`reads.${i}.reads.${j}.unit`] = 'W'
            // "name":"有功功率","unit":"kW","value":19770,
          } else if (reg.unit === 'kvar') {
            operation.updateOne.update.$set[`reads.${i}.reads.${j}.unit`] = 'var'
            // "name":"無功功率","unit":"kvar","value":0,
          } else if (reg.unit === 'kVA') {
            operation.updateOne.update.$set[`reads.${i}.reads.${j}.unit`] = 'VA'
            // "name":"視在功率","unit":"kVA","value":19770,
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
          logger.error(JSON.stringify(result.writeErrors, null, 2))
        }
        finishedOps += opsPerBatch
        logger.info(`finished: ${finishedOps}`)
      })
      bulkOpsPromises.push(promise)
      bulkOps = []
    }
  }, async (err) => {
    if (!_.isEmpty(bulkOps)) {
      const promise = logs.bulkWrite(bulkOps).then(result => {
        if (result.writeErrors) {
          logger.error(JSON.stringify(result.writeErrors, null, 2))
        }
        finishedOps += bulkOps.length
        logger.info(`finished: ${finishedOps}`)
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
      logger.info('All done')
      db.close()
    })
  })
})
