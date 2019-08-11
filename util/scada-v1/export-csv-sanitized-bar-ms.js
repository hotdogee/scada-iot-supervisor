require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
const config = require('config')
const _ = require('lodash')
const json2csv = require('json2csv')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const winston = require('winston')
const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        // setup console logging with timestamps
        level: 'info',
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


// cross-env MONGODB=mongodb://localhost:27017/scada-iot-20171105 node .\util\export-csv-sanitized.js
const outdir = 'csv-bar-ms'
// output to csv dir one file each day
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(async db => {
  // get start and end
  const bucket = '10m'
  const logs = db.collection(`logs.sanitized.${bucket}`)
  const firstLogTime = new Date('2017-10-19')
  const lastLogTime = new Date('2017-11-02')
  // intervel
  const intervel = lastLogTime - firstLogTime
  // get csv fields
  //
  let fields = [
    'M13-渦輪1前-壓力(bar)',
    'M13-渦輪1前-溫度(℃)',
    'M14-渦輪1後-壓力(bar)',
    'M14-渦輪1後-溫度(℃)',
    'M25-主排水管-密度(g/cm3)',
    'M25-主排水管-質量流率(t/h)',
    'M63-發電機1-三相功率(kW)',
    'M64-發電機1-頻率(Hz)'
  ]
  // sort fields
  const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^\(\)]*)\)$/
  const fieldNames = _.sortBy(fields, [k => {
    return parseInt(headerRe.exec(k)[1])
  }])
  fields = _.map(fieldNames, key => `reads.${key}`)
  // add logTime to front
  fields.unshift('logTime')
  fieldNames.unshift('logTime')
  // loop through logs
  mkdirp.sync(path.resolve(outdir))
  const start = new Date(firstLogTime.toDateString()).getTime()
  for (let fromTime = start; fromTime < lastLogTime; fromTime += intervel) {
    const from = new Date(fromTime)
    const to = new Date(fromTime + intervel)
    const data = await logs.find({ $and: [{ logTime: { $gte: from } }, { logTime: { $lt: to } }] })
      .project(fields.reduce((r, k) => (r[k] = 1, r), {})).sort({ logTime: 1 }).toArray()
    logger.debug(data.length, data[0])
    const avgData = _.map(data, doc => {
      _.forEach(doc.reads, (read, key) => {
        doc.reads[key] = read.total / read.count
      })
      return doc
    })
    logger.debug(avgData.length, avgData[0])
    const csv = json2csv({
      data: avgData, fields, fieldNames, withBOM: true
    })
    logger.debug(csv)
    // build filename
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
    const fromDate = from.toLocaleDateString('zh-TW', options).replace(/-/g,'')
    const toDate = to.toLocaleDateString('zh-TW', options).replace(/-/g,'')
    const fileName = `logs-${bucket}-${fromDate}-${toDate}.csv`
    const filepath = path.resolve(outdir, fileName)
    fs.writeFileSync(filepath, csv)
    logger.info(path.join(outdir, fileName))
  }
  db.close()
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
