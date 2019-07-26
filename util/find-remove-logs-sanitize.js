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

let index = 0
let opsPerBatch = 1000
let finishedOps = 0

const buckets = require('./lib/buckets')
let bulkOps = {}
for (let b in buckets) {
  bulkOps[b] = []
}
let bulkOpsPromises = []

// {"_id":{"$oid":"59897c0e6280a159550356e4"}}
// remove log.sanitized in target date range and rebuild using new rules
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(async db => {
  const from = new Date('2017-10-30T22:08:55.000Z') // 2017-10-31 06:08:55.118
  const to = new Date('2017-11-04T11:16:40.000Z') // 2017-11-04 19:16:39.079
  // we need to remove all logs starting and ending at the largest bucket times
  const bucketSize = buckets[Object.keys(buckets)[0]]
  const fromBucket = new Date(from - from % bucketSize)
  const toBucket = new Date(to - to % bucketSize + bucketSize)

  const deleteManyPromises = []
  for (let b in buckets) {
    const promise = db.collection(`logs.sanitized.${b}`).deleteMany(
      { $and: [{ logTime: { $gte: fromBucket } }, { logTime: { $lt: toBucket } }] }
    ).then(logger.info(`Deleted logs.sanitized.${b} from ${fromBucket} to ${toBucket}`))
    deleteManyPromises.push(promise)
  }
  const deleteResults = await Promise.all(bulkOpsPromises)
  console.log('Detele all done')
})

// TODO: 2017/11/2 8AM 前的流量要-2 tph

// 782332 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: { $and: [ { value: { $gt: 30000 } }, {$or: [ { unit: "" }, { unit: "kW" } ]} ] } }}}}).count()
// 1896 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: { $and: [ { value: { $gt: 30000 } }, {$and: [ { unit: { $ne: '' } }, { unit: { $ne: 'kW' } } ]} ] } }}}}).count()
// 1896 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: { $and: [ { value: { $gt: 30000 } }, { $or: [ { unit: 'kg' }, { unit: 'm3' } ] } ] } }}}}).pretty().count()
// 84003 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}},{reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}}).pretty()
// 10170 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}},{reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}}).pretty()
// 9155 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'bar' } }, { value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}},{reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'bar' } }, { value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}}).pretty()
// 0 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'bar' } }, { unit: { $ne: 'm3/h' } }, { value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}},{reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'bar' } }, { unit: { $ne: 'm3/h' } }, { value: { $lt: 0 } }, { value: { $ne: -1 } }]} }}}}).pretty()
// 73936 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'bar' } }, { unit: { $ne: 'm3/h' } }, { value: { $lt: 0 } }]} }}}},{reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'bar' } }, { unit: { $ne: 'm3/h' } }, { value: { $lt: 0 } }]} }}}}).pretty()
// 0 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'Hz' } }, { unit: { $ne: 'bar' } }, { unit: { $ne: 'm3/h' } }, { value: { $lt: 0 } }]} }}}}, {reads: {$elemMatch: { reads: { $elemMatch: {$and: [{ unit: { $ne: 'Hz' } }, { unit: { $ne: 'bar' } }, { unit: { $ne: 'm3/h' } }, { value: { $lt: 0 } }]} }}}}).pretty()
// 22666 = db.logs.find({reads: {$elemMatch: { reads: { $elemMatch: {unit: "°C"} }}}}).pretty()
// 65384 = db.logs.find({ reads: { $elemMatch: { reads: { $elemMatch: { name: "質量流率", time: { $lt: new Date('2017-10-19T11:00:50.000Z') } } } } } }, { reads: { $elemMatch: { reads: { $elemMatch: { name: "質量流率", time: { $lt: new Date('2017-10-19T11:00:50.000Z') } } } } } }).pretty()
// 1896 = db.logs.find({ reads: { $elemMatch: { reads: { $elemMatch: { unit: "kg/h", time: { $lt: new Date('2017-10-19T11:00:50.000Z') } } } } } }).sort({logTime:1}).limit(1).pretty()
// ISODate("2017-09-20T07:44:51.560Z")
// ISODate("2017-09-20T05:59:56.096Z")
// 1895 = db.logs.find({ reads: { $elemMatch: { reads: { $elemMatch: { unit: "t/h", time: { $lt: new Date('2017-09-20T07:44:51.560Z') } } } } } }).count()
// 1896 = db.logs.find({ reads: { $elemMatch: { reads: { $elemMatch: { unit: "t/h", time: { $lte: new Date('2017-09-20T07:44:51.560Z') } } } } } }).count()
// 1896 = db.logs.find({ reads: { $elemMatch: { reads: { $elemMatch: { unit: "t/h", time: { $lt: new Date('2017-09-20T07:44:52.560Z') } } } } } }).count()
//  = db.logs.find({ logTime: { $and: [{ $gt: new Date() }, { $lt: new Date() }]}, reads: { $elemMatch: { addr: 13, reads: { $elemMatch: { name: '壓力', value: { $gt: 8 } } } } } }).count()
//  = db.logs.find().count()
