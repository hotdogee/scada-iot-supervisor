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
let index = 0
let opsPerBatch = 10000
let finishedBatches = 0

MongoClient.connect(config.get('mongodb')).then(db => {
  const logs = db.collection('logs')
  logs.find({ logTime: { $exists: true, $type: 'string' } }).each((err, doc) => {
    if (doc) {
      // Got a document
      // console.log((++index) + " key: " + typeof doc.logTime)
      // console.log((++index) + " key: " + doc._id)
      // console.log(JSON.stringify(doc, null, 2))
      let updateOne = {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: {
            logTime: new Date(doc.logTime)
          } }
        }
      }
      _.forEach(doc.reads, (rtu, i) => {
        _.forEach(rtu.reads, (reg, j) => {
          if (!reg) {
            console.log(doc)
            console.log(rtu)
          } else if ('time' in reg) {
            updateOne.updateOne.update.$set[`reads.${i}.reads.${j}.time`] = new Date(reg.time)
          }
        })
      })
      // console.log(JSON.stringify(updateOne, null, 2))
      bulkOps.push(updateOne)
      if (bulkOps.length >= opsPerBatch) {
        logs.bulkWrite(bulkOps).then(result => {
          console.log(JSON.stringify(result, null, 2))
          finishedBatches++
          console.log(`finished: ${finishedBatches * opsPerBatch}`)
        })
        bulkOps = []
      }
    } else {
      logs.bulkWrite(bulkOps).then(result => {
        console.log(JSON.stringify(result, null, 2))
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
        db.close()
        return false
      })
    }
  })
});
