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

const buckets = require('../lib/buckets')
let bulkOps = {}
for (let b in buckets) {
  bulkOps[b] = []
}
let bulkOpsPromises = []

// {"_id":{"$oid":"59897c0e6280a159550356e4"}}
// 1. Fix gps -2
// 2. Ignore Hz == -1
// 3. Ignore Temp > 700
// remove log.sanitized in target date range and rebuild using new rules
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(async db => {
  const from = new Date('2017-08-01T21:18:55.409Z') // 2017-10-31 06:08:55.118
  const to = new Date() // 2017-11-04 19:16:39.079
  // we need to remove all logs starting and ending at the largest bucket times
  const bucketSize = buckets[Object.keys(buckets)[0]]
  const fromBucket = new Date(from - from % bucketSize)
  const toBucket = new Date(to - to % bucketSize + bucketSize)
  const logTimeFilter = { $and: [{ logTime: { $gte: fromBucket } }, { logTime: { $lt: toBucket } }] }

  const deleteManyPromises = []
  for (let b in buckets) {
    const promise = db.collection(`logs.sanitized.${b}`).deleteMany(logTimeFilter)
      .then(logger.info(`Deleted logs.sanitized.${b} from ${fromBucket} to ${toBucket}`))
    deleteManyPromises.push(promise)
  }
  const deleteResults = await Promise.all(bulkOpsPromises)
  console.log('Detele all done')
  // mongo
  // db.logs.find({},{logTime: 1}).sort({logTime:-1}).limit(1).pretty()
  const logs = db.collection('logs')
  logs.find(logTimeFilter).sort({ logTime: 1 }).forEach((doc) => {
    // Got a document
    // console.log((++index) + " key: " + typeof doc.logTime)
    // console.log((++index) + " key: " + doc._id)
    // console.log(JSON.stringify(doc, null, 2))
    // build update
    const bulkOp = {
      updateOne: {
        filter: { name: doc.name, logTime: doc.logTime },
        update: {
          $set: { name: doc.name, logTime: doc.logTime },
          $inc: { count: 1 },
          $min: {},
          $max: {}
        },
        upsert: true
      }
    }
    let hasData = false
    _.forEach(doc.reads, rtu => {
      _.forEach(rtu.reads, reg => {
        if (!rtu || ! reg || !rtu.name || !reg.name) {
          console.log(doc._id)
        } else if ((reg.unit === '' || reg.unit === 'kW') && 30000 < reg.value) {
          // Ignore 三相功率 and 三相功因 > 30000
        } else if (reg.unit === '℃' && (reg.value < 0 || 400 < reg.value)) {
          // '4489312' '{reads: {$elemMatch: { reads: { $elemMatch: {unit: '℃', value: { $gt: 400 }} }}}}'
          // Ignore 溫度 > 300
        } else if (reg.unit === 'm3/h' && (reg.value < 0 || 50 < reg.value)) {
          // Ignore m3/h < 0, > 50
        } else if (reg.unit === 'bar' && reg.value < 0.5) {
          // Ignore bar < 0.5
        } else if (reg.unit === 'Hz' && reg.value < 0) {
          // Ignore Hz < 0
        } else if (reg.unit === 't/h' && reg.time <= new Date('2017-09-20T07:44:52.560Z')) {
          // Ignore gpe data when we had an incorrect installation
        } else if (reg.unit === 'bar' && rtu.addr === 13 &&
          new Date('2017-08-08T15:40:22.634Z') <= reg.time && reg.time <= new Date('2017-08-10T08:00:23.344Z')) {
          // Bad sensor 移除錯誤 M13壓力
        } else if ((rtu.addr === 10 || rtu.addr === 14) && reg.unit === '℃' &&
          reg.time <= new Date('2017-08-10T04:09:26.329Z')) {
          // Bad sensor 移除錯誤 M10溫度 M14溫度
        } else if (rtu.addr === 13 && reg.unit === '℃' &&
          new Date('2017-11-03T02:28:22.000Z') <= reg.time && reg.time <= new Date('2017-11-04T11:16:40.000Z')) {
          // Bad sensor 移除錯誤 M13溫度  2017-11-03T02:28:23.427Z ~ 2017-11-04T11:16:39.079Z
        } else if (rtu.addr === 21 && reg.unit === '℃' &&
          new Date('2018-03-20T02:21:48.983Z') <= reg.time && reg.time <= new Date('2018-04-05T06:47:44.966Z')) {
          // Bad sensor 移除錯誤 M21溫度  2018-03-20T02:21:48.983Z ~ 2018-04-05T06:47:44.966Z
        } else if ([50, 51, 60, 61].includes(rtu.addr) && reg.unit === '℃' && 100 < reg.value) {
          // Ignore 軸心溫度 > 100
        } else if (Array.isArray(reg.value)) {
          // Ignore arrays
        } else if (reg.value != null) {
          // if (reg.unit === '°C') { // 溫度單位°C -> ℃
          //   reg.unit = '℃'
          // }
          if (rtu.addr === 9) { // M9 moved to M25
            // '517513' '{"reads":{"$elemMatch":{"addr":9}}}'
            rtu.addr = 25
          } else if (reg.unit === 'W') {
            reg.unit = 'kW'
            reg.value /= 1000
          } else if (reg.unit === 'var') {
            reg.unit = 'kvar'
            reg.value /= 1000
          } else if (reg.unit === 'VA') {
            reg.unit = 'kVA'
            reg.value /= 1000
          }
          // { 'reads.M2-手動���閥前-溫度(℃)': {$exists: true} }
          // { 'logTime': ISODate("2017-11-02T16:29:18.192Z") }
          // { 'reads.M6-渦輪2後-溫度(undefined)': {$exists: true} }
          // { $and: [{ logTime: { $gte: ISODate("2018-03-16T16:42:39.312Z") } }, { logTime: { $lt: ISODate("2018-03-16T16:42:39.312Z") } }], 'reads.M6-渦輪2後-溫度(undefined)': {$exists: true},  }
          // { 'logTime': ISODate("2018-03-16T16:42:39.312Z") }
          // { 'reads.M10-���貨櫃前-壓力(bar)': {$exists: true} }
          // M6-渦輪2後-溫度(undefined)
          // M10-���貨櫃前-壓力(bar)
          const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${reg.unit})`
          bulkOp.updateOne.update.$inc[`reads.${key}.count`] = 1
          bulkOp.updateOne.update.$inc[`reads.${key}.total`] = reg.value
          bulkOp.updateOne.update.$min[`reads.${key}.min`] = reg.value
          bulkOp.updateOne.update.$max[`reads.${key}.max`] = reg.value
          hasData = true
        }
      })
    })
    if (hasData) {
      for (let b in buckets) {
        const logTime = new Date(doc.logTime - doc.logTime % buckets[b])
        const query = { name: doc.name, logTime: logTime }
        const bucketBulkOp = {
          updateOne: {
            filter: query,
            update: {
              $set: query,
              $inc: bulkOp.updateOne.update.$inc,
              $min: bulkOp.updateOne.update.$min,
              $max: bulkOp.updateOne.update.$max
            },
            upsert: true
          }
        }
        bulkOps[b].push(bucketBulkOp)
        if (bulkOps[b].length >= opsPerBatch) {
          const promise = db.collection(`logs.sanitized.${b}`).bulkWrite(bulkOps[b], {ordered: true}).then((result) => {
            if (b == '10s') {
              if (result.writeErrors) {
                console.log(JSON.stringify(result.writeErrors, null, 2))
              }
              finishedOps += opsPerBatch
              console.log(`finished: ${finishedOps}`)
            }
          })
          bulkOpsPromises.push(promise)
          bulkOps[b] = []
        }
      }
    }
  }, async (err) => {
    for (let b in buckets) {
      if (!_.isEmpty(bulkOps[b])) {
        const promise = db.collection(`logs.sanitized.${b}`).bulkWrite(bulkOps[b], {ordered: true}).then((result) => {
          if (b == '10s') {
            if (result.writeErrors) {
              console.log(JSON.stringify(result.writeErrors, null, 2))
            }
            finishedOps += bulkOps[b].length
            console.log(`finished: ${finishedOps}`)
          }
        })
        bulkOpsPromises.push(promise)
      }
    }
    Promise.all(bulkOpsPromises).then(results => {
      console.log('All done')
      db.close()
    })
  })
})

// 2019/5/19
// finished: 7768101
// All done

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
