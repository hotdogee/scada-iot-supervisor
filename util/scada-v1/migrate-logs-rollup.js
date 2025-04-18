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
let finishedBatches = 0

const buckets = {
  '1d': 60 * 60 * 24 * 1000,
  '12h': 60 * 60 * 12 * 1000,
  '6h': 60 * 60 * 6 * 1000,
  '3h': 60 * 60 * 3 * 1000,
  '2h': 60 * 60 * 2 * 1000,
  '1h': 60 * 60 * 1000,
  '30m': 60 * 30 * 1000,
  '20m': 60 * 20 * 1000,
  '10m': 60 * 10 * 1000,
  '5m': 60 * 5 * 1000,
  '2m': 60 * 2 * 1000,
  '1m': 60 * 1000,
  '30s': 30 * 1000,
  '20s': 20 * 1000,
  '10s': 10 * 1000
}
let bulkOps = {}
for (let b in buckets) {
  bulkOps[b] = []
}
let bulkOpsPromises = []

// {"_id":{"$oid":"59897c0e6280a159550356e4"}}

MongoClient.connect(config.get('mongodb')).then(db => {
  for (let b in buckets) {
    db.collection(`logs.${b}`).createIndex(
      { "name": 1, "logTime": 1 },
      { background: false },
      function(err, results) {
        console.log(results)
      }
    )
  }
  const logs = db.collection('logs')
  logs.find().sort({'logTime': 1}).forEach((doc) => {
    // Got a document
    // console.log((++index) + " key: " + typeof doc.logTime)
    // console.log((++index) + " key: " + doc._id)
    // console.log(JSON.stringify(doc, null, 2))
    // build update
    const updateOne = {
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
    _.forEach(doc.reads, rtu => {
      _.forEach(rtu.reads, reg => {
        if (!rtu || ! reg || !rtu.name || !reg.name) {
          console.log(doc._id)
        } else if (reg.value != null) {
          const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${reg.unit})`
          updateOne.updateOne.update.$inc[`reads.${key}.count`] = 1
          updateOne.updateOne.update.$inc[`reads.${key}.total`] = reg.value
          updateOne.updateOne.update.$min[`reads.${key}.min`] = reg.value
          updateOne.updateOne.update.$max[`reads.${key}.max`] = reg.value
        }
      })
    })
    for (let b in buckets) {
      const logTime = new Date(doc.logTime - doc.logTime % buckets[b])
      const query = { name: doc.name, logTime: logTime }
      const bupdateOne = {
        updateOne: {
          filter: query,
          update: {
            $set: query,
            $inc: updateOne.updateOne.update.$inc,
            $min: updateOne.updateOne.update.$min,
            $max: updateOne.updateOne.update.$max
          },
          upsert: true
        }
      }
      bulkOps[b].push(bupdateOne)
      if (bulkOps[b].length >= opsPerBatch) {
        const promise = db.collection(`logs.${b}`).bulkWrite(bulkOps[b], {ordered: true}).then((result) => {
          if (b == '10s') {
            if (result.writeErrors) {
              console.log(JSON.stringify(result.writeErrors, null, 2))
            }
            finishedBatches++
            console.log(`finished: ${finishedBatches * opsPerBatch}`)
          }
        })
        bulkOpsPromises.push(promise)
        bulkOps[b] = []
      }
    }
  }, async (err) => {
    for (let b in buckets) {
      if (!_.isEmpty(bulkOps[b])) {
        const promise = db.collection(`logs.${b}`).bulkWrite(bulkOps[b], {ordered: true}).then((result) => {
          if (b == '10s') {
            if (result.writeErrors) {
              console.log(JSON.stringify(result.writeErrors, null, 2))
            }
            console.log(`finished: ${finishedBatches * opsPerBatch + bulkOps[b].length}`)
          }
        })
        bulkOpsPromises.push(promise)
      }
    }
    Promise.all(bulkOpsPromises).then(results => {
      console.log('All done')
      db.close()
    })
    // return false
  })
});
