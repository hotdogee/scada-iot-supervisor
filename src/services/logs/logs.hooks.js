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
        } else if (reg.unit === '℃' && (reg.value < 0 || 400 < reg.value)) {
          // Ignore ℃ > 400, < 0
        } else if ([50, 51, 60, 61].includes(rtu.addr) && reg.unit === '℃' && 100 < reg.value) {
          // Ignore 軸心溫度 > 100
        } else if (reg.unit === 'm3/h' && (reg.value > 50 || reg.value < -30)) {
          // Ignore m3/h > 50
        } else if (reg.value < 0 && (reg.unit === 'Hz' || reg.unit === 'bar' || reg.unit === 'm3/h')) {
          // Ignore Hz, bar, m3/h < 0
        } else if (Array.isArray(reg.value)) {
          // Ignore arrays
        } else if (reg.value != null) {
          if (reg.unit === '°C') { // 溫度單位°C -> ℃
            reg.unit = '℃'
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
      // range in ms
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
        const result = {}
        const docs = await collection.find(query).sort({'logTime': 1}).toArray()
        _.forEach(docs, doc => {
          const x = doc.logTime.getTime()
          _.forEach(doc.reads, (stat, key) => {
            if (!result[key]) {
              result[key] = []
            }
            stat.avg = stat.total / stat.count
            const point = {
              x: x,
              y: stat.avg,
              low: stat.min,
              high: stat.max
            }
            result[key].push(point)
          })
          // calculate extra series
          const m63kW = doc.reads['M63-發電機1-三相功率(kW)']
          // const m13bar = doc.reads['M13-渦輪1前-壓力(bar)']
          // const m14bar = doc.reads['M14-渦輪1後-壓力(bar)']
          // const m25tph = doc.reads['M25-主排水管-質量流率(t/h)']
          const m13bar = doc.reads['M5-渦輪2前-壓力(bar)']
          const m14bar = doc.reads['M6-渦輪2後-壓力(bar)']
          const m25tph = doc.reads['M26-排水管2-流量(m3/h)']
          const m64hz = doc.reads['M64-發電機1-頻率(Hz)']
          const turbineRadius = 0.215 // m
          const nozzleAngle = 30 / 180 * Math.PI // radians
          const formulas = {
            'M104-出噴嘴速度-計算(m/s)': (stat) => {
              if (m63kW && m25tph && m64hz) {
                const omega = 2 * Math.PI * m64hz[stat]
                const torque = m63kW[stat] * 1000 / omega
                const force = torque / turbineRadius
                const kgs = m25tph[stat] * 1000 / 3600
                const turbineSpeed = turbineRadius * omega
                const v2 = (force / (2 * kgs) + turbineSpeed) / Math.cos(nozzleAngle)
                // const v2 = ((m63kW[stat] * 1000) / (m64hz[stat] * m25tph[stat] * 2 * Math.PI * 0.215 * 2  * 1000 / 3600) + 0.215 * 2 * Math.PI * m64hz[stat]) / Math.cos(30 / 180 * Math.PI)
                // m63kW[stat] / (m64hz[stat] * m25tph[stat]) + m64hz[stat]
                return v2
              }
            }
          }
          let key = ''
          // M100-功率壓力-計算(kW/bar)
          //  = M63(kW)/(M13(bar)-M14(bar))
          // if (m63kW && m13bar && m14bar) {
          //   key = 'M100-功率壓力-計算(kW/bar)'
          //   if (!result[key]) {
          //     result[key] = []
          //   }
          //   const point = {
          //     x: x,
          //     y: m63kW.avg / (m13bar.avg - m14bar.avg),
          //     low: m63kW.min / (m13bar.min - m14bar.min),
          //     high: m63kW.max / (m13bar.max - m14bar.max)
          //   }
          //   result[key].push(point)
          // }
          // M101-功率壓力平方-計算(kW/bar2)
          //  = M63(kW)/(M13(bar)-M14(bar))^2
          if (m63kW && m13bar && m14bar) {
            key = 'M101-功率/壓力平方-計算(kW/bar2)'
            if (!result[key]) {
              result[key] = []
            }
            const point = {
              x: x,
              y: m63kW.avg / Math.pow(m13bar.avg - m14bar.avg, 2),
              low: m63kW.min / Math.pow(m13bar.min - m14bar.min, 2),
              high: m63kW.max / Math.pow(m13bar.max - m14bar.max, 2)
            }
            result[key].push(point)
          }
          // M102-功率流量四次方-計算(kW/bar4)
          //  = M25(t/h)/(M13(bar)-M14(bar))
          // if (m63kW && m25tph) {
          //   key = 'M102-功率流量四次方-計算(kW/tph4)'
          //   if (!result[key]) {
          //     result[key] = []
          //   }
          //   const point = {
          //     x: x,
          //     y: Math.pow(m63kW.avg, 0.25) / m25tph.avg,
          //     low: Math.pow(m63kW.min, 0.25) / m25tph.min,
          //     high: Math.pow(m63kW.max, 0.25) / m25tph.max
          //   }
          //   result[key].push(point)
          // }
          // M103-流量壓力根-計算(kW/bar0.5)
          //  = M25(t/h)/(M13(bar)-M14(bar))^0.5
          if (m25tph && m13bar && m14bar) {
            key = 'M103-流量/壓力根-計算(tph/bar0.5)'
            if (!result[key]) {
              result[key] = []
            }
            const point = {
              x: x,
              y: m25tph.avg / Math.pow(m13bar.avg - m14bar.avg, 0.5),
              low: m25tph.min / Math.pow(m13bar.min - m14bar.min, 0.5),
              high: m25tph.max / Math.pow(m13bar.max - m14bar.max, 0.5)
            }
            result[key].push(point)
          }
          // M104-出噴嘴速度-計算(m/s)
          if (m63kW && m25tph && m64hz) {
            key = 'M104-出噴嘴速度-計算(m/s)'
            if (!result[key]) {
              result[key] = []
            }
            const point = {
              x: x,
              y: formulas[key]('avg'),
              low: formulas[key]('min'),
              high: formulas[key]('max')
            }
            result[key].push(point)
            // M105-速度壓力根-計算(ms/bar0.5)
            if (m13bar && m14bar) {
              key = 'M105-速度壓力根-計算(ms/bar0.5)'
              if (!result[key]) {
                result[key] = []
              }
              const point = {
                x: x,
                y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 0.5),
                low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 0.5),
                high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 0.5)
              }
              result[key].push(point)
            }
            // // M106-速度壓力-計算(ms/bar)
            // if (m13bar && m14bar) {
            //   key = 'M106-速度壓力-計算(ms/bar)'
            //   if (!result[key]) {
            //     result[key] = []
            //   }
            //   const point = {
            //     x: x,
            //     y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 1),
            //     low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 1),
            //     high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 1)
            //   }
            //   result[key].push(point)
            // }
            // // M107-速度壓力平方-計算(ms/bar2)
            // if (m13bar && m14bar) {
            //   key = 'M107-速度壓力平方-計算(ms/bar2)'
            //   if (!result[key]) {
            //     result[key] = []
            //   }
            //   const point = {
            //     x: x,
            //     y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 2),
            //     low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 2),
            //     high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 2)
            //   }
            //   result[key].push(point)
            // }
          }
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
              if (!rtu || ! reg || !rtu.name || !reg.name || Array.isArray(reg.value)) {
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
