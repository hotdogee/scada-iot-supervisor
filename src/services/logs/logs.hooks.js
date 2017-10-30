const _ = require('lodash')
const Ajv = require('ajv')
const { authenticate } = require('feathers-authentication').hooks;
const { validateSchema, client } = require('feathers-hooks-common');

let createLogSchema = {
  properties: {
    logTime: {
      instanceof: 'Date',
      coerce: (data) => new Date(data)
    },
    reads: {
      type: 'array',
      items: {
        properties: {
          reads: {
            type: 'array',
            items: {
              properties: {
                time: {
                  instanceof: 'Date',
                  coerce: (data) => new Date(data)
                }
              }
            }
          }
        }
      }
    }
  }
}

const ajv = new Ajv({ allErrors: true, $data: true })
require('ajv-keywords')(ajv)
ajv.addKeyword('coerce', {
  type: 'string',
  modifying: true,
  validate: (fn, data, ps, path, parent, key) => {
    parent[key] = fn(data)
    return true
  }
})

module.exports = {
  before: {
    all: [],
    find: [ client('chart', 'bucket'), convertDate(), handleChart() ],
    get: [],
    create: [ authenticate('jwt'), validateSchema(createLogSchema, ajv) ],
    update: [ authenticate('jwt') ],
    patch: [ authenticate('jwt') ],
    remove: [ authenticate('jwt') ]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [ upsertRollup() ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}

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
  '10s': 10 * 1000,
  '1ms': 1
}

function upsertRollup(options = {}) {
  return context => {
    const data = context.result
    const db = context.service.db
    const options = { upsert: true }
    // build update
    let update = {
      $set: { name: data.name, logTime: data.logTime },
      $inc: { count: 1 },
      $min: {},
      $max: {}
    }
    _.forEach(data.reads, rtu => {
      _.forEach(rtu.reads, reg => {
        if (!rtu || ! reg || !rtu.name || !reg.name) {
          console.log(data._id)
        } else if (reg.value > 30000 && (reg.unit === '' || reg.unit === 'kW')) {
          // Ignore 三相功率 and 三相功因 > 30000
        } else if (reg.value != null) {
          if (reg.unit === '°C') { // 溫度單位°C -> ℃
            reg.unit = '℃'
          }
          const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${reg.unit})`
          update.$inc[`reads.${key}.count`] = 1
          update.$inc[`reads.${key}.total`] = reg.value
          update.$min[`reads.${key}.min`] = reg.value
          update.$max[`reads.${key}.max`] = reg.value
        }
      })
    })
    for (b in buckets) {
      let logTime = new Date(data.logTime - data.logTime % buckets[b])
      let query = { name: data.name, logTime: logTime }
      let bupdate = Object.assign({}, update)
      bupdate.$set = query
      db.collection(`logs.sanitized.${b}`).updateOne(query, bupdate, options)
    }
  }
}

function handleChart(options = {}) {
  return async context => {
    const params = context.params
    const logs = context.service
    const canvasSize = 500
    // raw bucket
    // 1688 logs per hour
    // Full: > 2 hours = 60 * 60 * 2 = 7200
    // 10s bucket
    // 360 logs per hour
    // Full: > 10 hours = 60 * 60 * 10 = 36000
    // if (range / bucket[i] > canvasSize)
    // start from large buckets, use first bucket that can fill the canvas
    if (params && params.chart) {
      // get start, end, range
      let start = undefined
      if (params.query.logTime && params.query.logTime.$gt) {
        start = params.query.logTime.$gt
      }
      if (!start) { // default to time of first log in db
        start = (await logs.find({
          query: {
            $limit: 1,
            $sort: {
              logTime: 1
            }
          }
        })).data[0].logTime
      }
      let end = undefined
      if (params.query.logTime && params.query.logTime.$lt) {
        end = params.query.logTime.$lt
      }
      if (!end) { // default to time of last log in db
        end = (await logs.find({
          query: {
            $limit: 1,
            $sort: {
              logTime: -1
            }
          }
        })).data[0].logTime
      }
      // range in seconds
      let range = (end - start)
      // get bucket
      let bucket = 'all' // no bucket
      for (b in buckets) {
        if (range / buckets[b] > canvasSize) {
          bucket = b
          break
        }
      }
      // build result
      const query = {
        logTime: {
          $gt: start,
          $lt: end
        }
      }
      if (bucket) {
        const collection = context.service.db.collection(`logs.sanitized.${bucket}`)
        let result = {}
        let docs = await collection.find(query).sort({'logTime': 1}).toArray()
        _.forEach(docs, doc => {
          let x = doc.logTime.getTime()
          _.forEach(doc.reads, (stat, key) => {
            if (!result[key]) {
              result[key] = []
            }
            let point = {
              x: x,
              y: stat.total / stat.count,
              low: stat.min,
              high: stat.max
            }
            result[key].push(point)
          })
        })
        // sort keys
        const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^\(\)]*)\)$/
        const sortedResult = _.sortBy(Object.keys(result), [k => {
          return parseInt(headerRe.exec(k)[1])
        }]).reduce((r, k) => (r[k] = result[k], r), {})
        context.result = { bucket, start, end, data: sortedResult }
      } else {
        const collection = context.service.db.collection(`logs`)
        let result = {}
        let docs = await collection.find(query).sort({'logTime': 1}).toArray()
        _.forEach(docs, doc => {
          let x = doc.logTime.getTime()
          _.forEach(doc.reads, rtu => {
            _.forEach(rtu.reads, reg => {
              if (!rtu || ! reg || !rtu.name || !reg.name) {
                // console.log(doc._id)
              } else {
                const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${reg.unit})`
                if (!result[key]) {
                  result[key] = []
                }
                let point = {
                  x: x,
                  y: reg.value,
                  low: reg.value,
                  high: reg.value
                }
                result[key].push(point)
              }
            })
          })
        })
        // sort keys
        const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^\(\)]*)\)$/
        const sortedResult = _.sortBy(Object.keys(result), [k => {
          return parseInt(headerRe.exec(k)[1])
        }]).reduce((r, k) => (r[k] = result[k], r), {})
        context.result = { bucket: null, start, end, data: sortedResult }
      }
    }
  }
}

function convertDate(options = {}) {
  return context => {
    const params = context.params
    if (params && params.query && params.query.logTime) {
      if (params.query.logTime.$gt) {
        params.query.logTime.$gt = new Date(params.query.logTime.$gt)
      }
      if (params.query.logTime.$lt) {
        params.query.logTime.$lt = new Date(params.query.logTime.$lt)
      }
    }
  }
}

// buckets: 10s, 20s, 30s, 1m, 2m, 5m, 10m, 20m, 30m, 1h, 2h, 3h, 6h, 12h, 1d
// collections: 10s, 1m, 1hr, 1day
