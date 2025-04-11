require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
const config = require('config')
const _ = require('lodash')
const { Parser } = require('json2csv')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const { createLogger, format, transports } = require('winston')
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.splat(),
    format.timestamp(),
    format.ms(),
    format.simple()
  ),
  transports: [new transports.Console()]
})

// cross-env MONGODB=mongodb://localhost:27017/scada-iot-20171105 node .\util\export-csv-sanitized.js
// node --max-old-space-size=65535 ./util/scada-v1/export-csv-sanitized.js
// tar -czvf geo9-logs.tar.gz /home/hotdogee/csv
const outdir = '/home/hotdogee/csv'
mkdirp.sync(path.resolve(outdir))
// output to csv dir one file each day
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)

function flattenLog (log) {
  const l = { 時間: log.logTime }
  log.reads.forEach((rtu) => {
    // { name: '軸心1', addr: 62, reads: -1 },
    if (Array.isArray(rtu.reads)) {
      rtu.reads.forEach((reg) => {
        if (!rtu || !reg || !rtu.name || !reg.name) {
          // console.log(data._id)
        } else if (
          reg.value > 30000 &&
          (reg.unit === '' || reg.unit === 'kW')
        ) {
          // Ignore 三相功率 and 三相功因 > 30000
        } else if (reg.unit === '℃' && (reg.value < 0 || reg.value > 400)) {
          // Ignore ℃ > 400, < 0
        } else if (
          [50, 51, 60, 61].includes(rtu.addr) &&
          reg.unit === '℃' &&
          reg.value > 100
        ) {
          // Ignore 軸心溫度 > 100
        } else if (reg.unit === 'm3/h' && (reg.value < 0 || reg.value > 50)) {
          // Ignore m3/h < 0, > 50
        } else if (reg.unit === 'bar' && reg.value < 0.5) {
          // Ignore bar < 0.5
        } else if (reg.unit === 'Hz' && reg.value < 0) {
          // Ignore Hz < 0
        } else if (reg.value != null) {
          if (reg.name.slice(-3) === '諧波比') {
            // 'A相電流諧波比'
            reg.value.forEach((v, i) => {
              l[
                `M${rtu.addr}-${rtu.name}-${reg.name}-${i + 2}次(${reg.unit})`
              ] = v
            })
          } else {
            let unit = reg.unit
            let value = reg.value
            if (reg.unit === '°C') {
              // 溫度單位°C -> ℃
              unit = '℃'
            } else if (reg.unit === 'W') {
              unit = 'kW'
              value /= 1000
            } else if (reg.unit === 'var') {
              unit = 'kvar'
              value /= 1000
            } else if (reg.unit === 'VA') {
              unit = 'kVA'
              value /= 1000
            }
            l[`M${rtu.addr}-${rtu.name}-${reg.name}(${unit})`] = value
          }
        }
      })
    }
  })
  return l
}

const headerRe = /^M(\d+)-/

;(async () => {
  try {
    const client = await MongoClient.connect(mongodb, {
      useNewUrlParser: true
    })
    const db = client.db()
    const interval = 60 * 60 * 24 * 1000 // 1d
    // const timezoneOffset = -60 * new Date().getTimezoneOffset() * 1000
    // get start and end
    // const bucket = '1ms'
    // const logs = await db.collection(`logs.sanitized.${bucket}`)
    const logs = await db.collection(`logs`)
    const firstLogTime = (await logs
      .find()
      .sort({ logTime: 1 })
      .limit(1)
      .next()).logTime
    const lastLogTime = (await logs
      .find()
      .sort({ logTime: -1 })
      .limit(1)
      .next()).logTime
    // 2017-08-07T20:39:30.088Z
    // 2020-03-24T02:07:56.033Z
    // loop through logs
    // const start = new Date(firstLogTime.toDateString()).getTime()
    const start = new Date('May 08 2019').getTime()
    // const start = new Date(lastLogTime.toDateString()).getTime()
    // 1502121600000 2017-08-07T16:00:00.000Z 'Tue Aug 08 2017'
    for (let fromTime = start; fromTime < lastLogTime; fromTime += interval) {
      // for (
      //   let fromTime = start;
      //   fromTime < start + interval;
      //   fromTime += interval
      // ) {
      // find data from db
      const from = new Date(fromTime)
      const to = new Date(fromTime + interval)
      const data = await logs
        .find({ $and: [{ logTime: { $gte: from } }, { logTime: { $lt: to } }] })
        .sort({ logTime: 1 })
        .toArray()
      // empty?
      if (data.length === 0) {
        continue
      }
      // flatten data
      const flatdata = data.map(flattenLog)
      // sort fields
      const parser = new Parser({
        withBOM: true
      })
      parser.parse(flatdata)
      parser.opts.fields.sort((a, b) => {
        if (a.label === '時間') {
          return -1
        } else if (b.label === '時間') {
          return 1
        }
        return (
          parseInt(headerRe.exec(a.label)[1]) -
          parseInt(headerRe.exec(b.label)[1])
        )
      })
      // convert data to csv
      const csv = parser.parse(flatdata)
      // build filename
      const filename = `logs-${from.getFullYear()}-${(from.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${from
        .getDate()
        .toString()
        .padStart(2, '0')}.csv`
      const filepath = path.resolve(outdir, filename)
      fs.writeFileSync(filepath, csv)
      logger.info(path.join(outdir, filename))
    }
    client.close()
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})()

// let data
// ;(async () => {
//   try {
//     const client = await MongoClient.connect(mongodb, {
//       useNewUrlParser: true
//     })
//     const db = client.db()
//     const interval = 60 * 60 * 24 * 1000 // 1d
//     // const timezoneOffset = -60 * new Date().getTimezoneOffset() * 1000
//     // get start and end
//     // const bucket = '1ms'
//     // const logs = await db.collection(`logs.sanitized.${bucket}`)
//     const logs = await db.collection(`logs`)
//     const firstLogTime = (await logs
//       .find()
//       .sort({ logTime: 1 })
//       .limit(1)
//       .next()).logTime
//     const lastLogTime = (await logs
//       .find()
//       .sort({ logTime: -1 })
//       .limit(1)
//       .next()).logTime
//     // 2017-08-07T20:39:30.088Z
//     // 2020-03-24T02:07:56.033Z
//     // loop through logs
//     // const start = new Date(firstLogTime.toDateString()).getTime()
//     const start = new Date('Tue Aug 12 2017').getTime()
//     // const start = new Date(lastLogTime.toDateString()).getTime()
//     // 1502121600000 2017-08-07T16:00:00.000Z 'Tue Aug 08 2017'
//     // for (let fromTime = start; fromTime < lastLogTime; fromTime += interval) {
//     for (
//       let fromTime = start;
//       fromTime < start + interval;
//       fromTime += interval
//     ) {
//       // find data from db
//       const from = new Date(fromTime)
//       const to = new Date(fromTime + interval)
//       data = await logs
//         .find({ $and: [{ logTime: { $gte: from } }, { logTime: { $lt: to } }] })
//         .sort({ logTime: 1 })
//         .toArray()
//       // build filename
//       const filename = `logs-${from.getFullYear()}-${(from.getMonth() + 1)
//         .toString()
//         .padStart(2, '0')}-${from
//         .getDate()
//         .toString()
//         .padStart(2, '0')}.csv`
//       const filepath = path.resolve(outdir, filename)
//       logger.info(path.join(outdir, filename))
//     }
//     client.close()
//   } catch (error) {
//     logger.error(error)
//   } finally {
//     // process.exit()
//   }
// })()

// // flatten data
// flatdata = data.map(flattenLog)
// // sort fields
// parser = new Parser({
//   withBOM: true
// })
// parser.parse(flatdata)
// parser.opts.fields.sort((a, b) => {
//   if (a.label == '時間') {
//     return -1
//   } else if (b.label == '時間') {
//     return 1
//   }
//   return (
//     parseInt(headerRe.exec(a.label)[1]) - parseInt(headerRe.exec(b.label)[1])
//   )
// })
// // convert data to csv
// csv = parser.parse(flatdata)

// flattenLog(data[0])
// data.map(flattenLog)
// opts = {
//   withBOM: true
// }
// parser = new Parser(opts)
// parser.parse(data.slice(0, 2).map(flattenLog))
// headerRe = /^M(\d+)-/
// headerRe.exec('M72-併接點-A相電流諧波比-25次(%)')[1]
// parser.opts.fields.sort((a, b) => {
//   if (a.label == '時間') {
//     return -1
//   } else if (b.label == '時間') {
//     return 1
//   }
//   return parseInt(headerRe.exec(a.label)[1]) - parseInt(headerRe.exec(b.label)[1])
// })
// console.log(parser.parse(data.slice(0, 2).map(flattenLog)))
// console.log(parser.parse(data.slice(0, 2)))

// {
//   _id: '5e78dd0156dfff658a877b35',
//   name: 'Geo9',
//   logTime: '2020-03-23T16:00:01.335Z',
//   reads: [
//     { name: '發電機300kVA', addr: 71, reads: [Array] },
//     {
//       name: '併接點',
//       addr: 72,
//       reads: [
//         {
//           name: 'AB線電壓',
//           unit: 'V',
//           value: 397.85,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: 'BC線電壓',
//           unit: 'V',
//           value: 396.92,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: 'CA線電壓',
//           unit: 'V',
//           value: 396.36,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: 'A相電流',
//           unit: 'A',
//           value: 38.7,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: 'B相電流',
//           unit: 'A',
//           value: 38.58,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: 'C相電流',
//           unit: 'A',
//           value: 39.54,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: '有功功率',
//           unit: 'W',
//           value: 26772,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: '無功功率',
//           unit: 'var',
//           value: 0,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: '視在功率',
//           unit: 'VA',
//           value: 26772,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: '功率因數',
//           unit: '%',
//           value: 100,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: '頻率',
//           unit: 'Hz',
//           value: 59.956,
//           time: '2020-03-23T15:59:59.912Z'
//         },
//         {
//           name: '正有功電量',
//           unit: 'kWh',
//           value: 251076.47,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: '負有功電量',
//           unit: 'kWh',
//           value: 1603.72,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: '正無功電量',
//           unit: 'kvarh',
//           value: 375.77,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: '負無功電量',
//           unit: 'kvarh',
//           value: 1160.97,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: '有功電量',
//           unit: 'kWh',
//           value: 252680.19,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: '無功電量',
//           unit: 'kvarh',
//           value: 1536.74,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: '視在電量',
//           unit: 'kVAh',
//           value: 253390.54,
//           time: '2020-03-23T15:59:59.992Z'
//         },
//         {
//           name: 'A相電流諧波比',
//           unit: '%',
//           value: [
//             0.04,
//             0.08,
//             0.08,
//             0.04,
//             0,
//             0.04,
//             0.04,
//             0.04,
//             0,
//             0.11,
//             0,
//             0.04,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0
//           ],
//           time: '2020-03-23T16:00:00.087Z'
//         },
//         {
//           name: 'B相電流諧波比',
//           unit: '%',
//           value: [
//             0,
//             0.18,
//             0.04,
//             0,
//             0,
//             0,
//             0.04,
//             0,
//             0,
//             0.11,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0
//           ],
//           time: '2020-03-23T16:00:00.183Z'
//         },
//         {
//           name: 'C相電流諧波比',
//           unit: '%',
//           value: [
//             0,
//             0.31,
//             0.04,
//             0,
//             0,
//             0,
//             0.04,
//             0,
//             0.04,
//             0.14,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0
//           ],
//           time: '2020-03-23T16:00:00.279Z'
//         },
//         {
//           name: 'A相電壓諧波比',
//           unit: '%',
//           value: [
//             0,
//             0.05,
//             0.02,
//             0.07,
//             0,
//             0.06,
//             0.02,
//             0.02,
//             0,
//             0.04,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0
//           ],
//           time: '2020-03-23T16:00:00.375Z'
//         },
//         {
//           name: 'B相電壓諧波比',
//           unit: '%',
//           value: [
//             0,
//             0.06,
//             0,
//             0.07,
//             0,
//             0.05,
//             0,
//             0.03,
//             0,
//             0.03,
//             0,
//             0.02,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0.02,
//             0,
//             0,
//             0,
//             0.02,
//             0,
//             0,
//             0,
//             0.02,
//             0,
//             0
//           ],
//           time: '2020-03-23T16:00:00.471Z'
//         },
//         {
//           name: 'C相電壓諧波比',
//           unit: '%',
//           value: [
//             0,
//             0.06,
//             0,
//             0.08,
//             0,
//             0.03,
//             0.02,
//             0.02,
//             0,
//             0.03,
//             0,
//             0.02,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0.02,
//             0,
//             0.02,
//             0,
//             0,
//             0,
//             0.02,
//             0,
//             0
//           ],
//           time: '2020-03-23T16:00:00.567Z'
//         }
//       ]
//     },
//     { name: '發電機300kVA', addr: 73, reads: [Array] }
//   ]
// }

// { _id: 5ce1727cb32564ba7b3784e5,
//   logTime: 2017-08-07T20:42:20.033Z,
//   name: 'Geo9',
//   count: 1,
//   reads:
//    { 'M1-九號井口-溫度(℃)': [Object],
//      'M10-上貨櫃前-壓力(bar)': [Object],
//      'M11-三桶前-壓力(bar)': [Object],
//      'M11-三桶前-溫度(℃)': [Object],
//      'M13-渦輪1前-壓力(bar)': [Object],
//      'M13-渦輪1前-溫度(℃)': [Object],
//      'M14-渦輪1後-壓力(bar)': [Object],
//      'M2-手動閘閥前-壓力(bar)': [Object],
//      'M2-手動閘閥前-溫度(℃)': [Object],
//      'M21-尾水箱-壓力(bar)': [Object],
//      'M22-主排水管-流量(m3/h)': [Object],
//      'M60-軸心1-入水測溫度(℃)': [Object],
//      'M61-軸心1-發電機測溫度(℃)': [Object],
//      'M62-軸心1-轉速(Hz)': [Object],
//      'M63-發電機1-A相電壓(V)': [Object],
//      'M63-發電機1-A相電流(A)': [Object],
//      'M63-發電機1-B相電壓(V)': [Object],
//      'M63-發電機1-B相電流(A)': [Object],
//      'M63-發電機1-C相電壓(V)': [Object],
//      'M63-發電機1-C相電流(A)': [Object],
//      'M63-發電機1-三相功率(kW)': [Object],
//      'M63-發電機1-發電量(kWh)': [Object],
//      'M64-發電機1-頻率(Hz)': [Object] } }

// const from = new Date(start)
// const filepath = path.resolve(
//   outdir,
//   `logs-${from.getFullYear()}-${(from.getMonth() + 1)
//     .toString()
//     .padStart(2, '0')}-${from
//     .getDate()
//     .toString()
//     .padStart(2, '0')}.csv`
// )
// MongoClient.connect(mongodb).then(async (db) => {
//   // interval
//   const interval = 60 * 60 * 24 * 1000 // 1d
//   const timezoneOffset = -60 * new Date().getTimezoneOffset() * 1000
//   // get start and end
//   const bucket = '1ms'
//   const logs = db.collection(`logs.sanitized.${bucket}`)
//   const firstLogTime = (await logs
//     .find()
//     .sort({ logTime: 1 })
//     .limit(1)
//     .next()).logTime
//   const lastLogTime = (await logs
//     .find()
//     .sort({ logTime: -1 })
//     .limit(1)
//     .next()).logTime
//   // get csv fields
//   let fields = (await db
//     .collection(`logs.sanitized.1d`)
//     .aggregate([
//       {
//         $project: {
//           kv: { $objectToArray: '$reads' }
//         }
//       },
//       { $unwind: '$kv' },
//       {
//         $group: {
//           _id: '$kv.k'
//         }
//       },
//       { $sort: { _id: 1 } },
//       {
//         $group: {
//           _id: null,
//           fields: {
//             $push: '$_id'
//           }
//         }
//       }
//     ])
//     .next()).fields
//   // sort fields
//   const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^\(\)]*)\)$/
//   const fieldNames = _.sortBy(fields, [
//     (k) => {
//       return parseInt(headerRe.exec(k)[1])
//     }
//   ])
//   fields = _.map(fieldNames, (key) => `reads.${key}.total`)
//   // add logTime to front
//   fields.unshift('logTime')
//   fieldNames.unshift('logTime')
//   // loop through logs
//   mkdirp.sync(path.resolve(outdir))
//   const start = new Date(firstLogTime.toDateString()).getTime()
//   for (let fromTime = start; fromTime < lastLogTime; fromTime += interval) {
//     const from = new Date(fromTime)
//     const to = new Date(fromTime + interval)
//     const data = await logs
//       .find({ $and: [{ logTime: { $gte: from } }, { logTime: { $lt: to } }] })
//       .sort({ logTime: 1 })
//       .toArray()
//     const csv = json2csv({
//       data,
//       fields,
//       fieldNames,
//       withBOM: true
//     })
//     // build filename
//     const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
//     const filename = from.toLocaleDateString('zh-TW', options).replace(/-/g, '')
//     const filepath = path.resolve(outdir, `logs-${filename}.csv`)
//     fs.writeFileSync(filepath, csv)
//     logger.info(path.join(outdir, `logs-${filename}.csv`))
//   }
//   db.close()
// })

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
