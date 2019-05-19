// cross-env MONGODB=mongodb://localhost:27017/scada-iot-20190514 node .\util\migration-20190517\list-logs-old-c.js
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

const buckets = require('../lib/buckets')
// {"_id":{"$oid":"59897c0e6280a159550356e4"}}
// 1. Fix gps -2
// 2. Ignore Hz == -1
// 3. Ignore Temp > 700
// remove log.sanitized in target date range and rebuild using new rules
const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(async db => {
  try {
    const logs = db.collection('logs')
    // const result = await logs.find({reads: {$elemMatch: { reads: { $elemMatch: {unit: "°C"} }}}}).count()
    // const result = await logs.find({reads: {$elemMatch: { reads: { $elemMatch: {unit: '℃', value: { $gt: 400 }} }}}}).count()
    // logger.info('All done', result)

    // const checkAddr9 = {reads: {$elemMatch: { addr: 9 }}}
    // const result = await logs.find(checkAddr9).count()
    // logger.info(`Done '${result}' '${JSON.stringify(checkAddr9)}'`)

    // COUNT ALL LOGS
    // const from = new Date('2017-08-01T21:18:55.409Z') // 2017-10-31 06:08:55.118
    // const to = new Date() // 2017-11-04 19:16:39.079
    // const bucketSize = buckets[Object.keys(buckets)[0]]
    // const fromBucket = new Date(from - from % bucketSize)
    // const toBucket = new Date(to - to % bucketSize + bucketSize)
    // const logTimeFilter = { $and: [{ logTime: { $gte: fromBucket } }, { logTime: { $lt: toBucket } }] }
    // const result = await logs.find(logTimeFilter).count()
    // logger.info(`logTimeFilter '${result}' '${JSON.stringify(logTimeFilter)}'`)

    // // COUNT RTUs ADDR = 72 or 73
    // const addr72_73 = { reads: { $elemMatch: { addr: { $in: [ 72, 73 ] } } } }
    // const start = await logs.find(addr72_73).sort({ logTime: 1 }).limit(1).toArray()
    // // "logTime":"2019-05-08T01:54:58.784Z"
    // const end = await logs.find(addr72_73).sort({ logTime: -1 }).limit(1).toArray()
    // // "logTime":"2019-05-14T05:13:10.871Z"
    // // const count = await logs.find(addr72_73).count()
    // // addr72_73 '328658' '{"reads":{"$elemMatch":{"addr":{"$in":[72,73]}}}}'
    // // logger.info(`addr72_73: '${count}', '${start}', '${end}', '${JSON.stringify(addr72_73)}'`)
    // logger.info(`addr72_73: '${JSON.stringify(start)}', '${JSON.stringify(end)}', '${JSON.stringify(addr72_73)}'`)

    // // COUNT FREQ wrong unit = '%'
    // const freqpercent = { reads: { $elemMatch: { reads: { $elemMatch: { name : '頻率', unit: '%' } } } } }
    // const start = await logs.find(freqpercent).sort({ logTime: 1 }).limit(1).toArray()
    // // "logTime":"2019-05-08T01:54:58.784Z"
    // const end = await logs.find(freqpercent).sort({ logTime: -1 }).limit(1).toArray()
    // // "logTime":"2019-05-08T10:14:08.803Z"
    // const count = await logs.find(freqpercent).count()
    // // addr72_73 '16987'
    // logger.info(`freqpercent: '${JSON.stringify(count)}', '${JSON.stringify(start)}', '${JSON.stringify(end)}', '${JSON.stringify(freqpercent)}'`)

    // GET
    // { 'reads.M2-手動���閥前-溫度(℃)': {$exists: true}}
    // { 'logTime': ISODate("2017-11-02T16:29:18.192Z") }
    const badName = { logTime: new Date('2017-11-02T16:29:18.192Z') }
    const item = await logs.find(badName).toArray()
    // addr72_73 '16987'
    logger.info(`badName: '${JSON.stringify(item)}', '${JSON.stringify(badName)}'`)
  } catch (error) {
    logger.error(error)
  } finally {
    db.close()
    process.exit()
  }
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

// // COUNT RTUs ADDR = 72 or 73
// [{"_id":"5cd236f2bc7583589fb35c1a","name":"Geo9","logTime":"2019-05-08T01:54:58.784Z","reads":[{"name":"發電機300kVA","addr":71,"reads":[{"name":"頻率","unit":"Hz","value":41.55,"time":"2019-05-08T01:54:57.218Z"}]},{"name":"併接點","addr":72,"reads":[{"name":"AB線電壓","unit":"V","value":396.67,"time":"2019-05-08T01:54:57.330Z"},{"name":"BC線電壓","unit":"V","value":397,"time":"2019-05-08T01:54:57.330Z"},{"name":"CA線電壓","unit":"V","value":395.76,"time":"2019-05-08T01:54:57.330Z"},{"name":"A相電流","unit":"A","value":29.4,"time":"2019-05-08T01:54:57.330Z"},{"name":"B相電流","unit":"A","value":29.7,"time":"2019-05-08T01:54:57.330Z"},{"name":"C相電流","unit":"A","value":27.3,"time":"2019-05-08T01:54:57.330Z"},{"name":"有功功率","unit":"kW","value":19770,"time":"2019-05-08T01:54:57.330Z"},{"name":"無功功率","unit":"kvar","value":0,"time":"2019-05-08T01:54:57.330Z"},{"name":"視在功率","unit":"kVA","value":19770,"time":"2019-05-08T01:54:57.330Z"},{"name":"功率因數","unit":"%","value":100,"time":"2019-05-08T01:54:57.330Z"},{"name":"頻率","unit":"%","value":59.946,"time":"2019-05-08T01:54:57.330Z"},{"name":"有功電量","unit":"kWh","value":4290.27,"time":"2019-05-08T01:54:57.409Z"},{"name":"無功電量","unit":"kvarh","value":403.34,"time":"2019-05-08T01:54:57.409Z"},{"name":"視在電量","unit":"kVAh","value":4452.37,"time":"2019-05-08T01:54:57.409Z"},{"name":"A相電流諧波比","unit":"%","value":[0.06,0.33,0.06,0.1,0,0,0,0,0.06,0.29,0,0.1,0,0.06,0,0.06,0,0.06,0,0.06,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-08T01:54:57.507Z"},{"name":"B相電流諧波比","unit":"%","value":[0.1,0.52,0.06,0,0.06,0,0.06,0.06,0,0.24,0,0,0.06,0,0,0.06,0,0,0,0.06,0,0.06,0,0,0,0,0,0.06,0,0],"time":"2019-05-08T01:54:57.617Z"},{"name":"C相電流諧波比","unit":"%","value":[0,0.47,0.06,0.06,0,0.06,0,0.06,0,0.27,0,0.06,0,0,0,0.06,0,0.06,0,0,0,0,0,0,0,0,0,0.06,0,0],"time":"2019-05-08T01:54:57.713Z"},{"name":"A相電壓諧波比","unit":"%","value":[0,0.03,0.02,0.06,0.02,0.06,0,0.02,0,0.03,0,0.02,0,0.02,0,0.02,0,0.02,0,0.02,0,0,0,0.02,0,0,0,0,0,0.02],"time":"2019-05-08T01:54:57.826Z"},{"name":"B相電壓諧波比","unit":"%","value":[0,0.05,0.02,0.07,0,0.05,0,0.02,0,0.03,0,0.02,0,0,0,0.02,0,0,0,0,0,0.02,0,0.02,0,0,0,0.02,0,0],"time":"2019-05-08T01:54:57.921Z"},{"name":"C相電壓諧波比","unit":"%","value":[0,0.04,0.02,0.05,0,0.05,0,0.02,0,0.03,0,0.02,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.02,0,0],"time":"2019-05-08T01:54:58.017Z"}]},{"name":"發電機300kVA","addr":73,"reads":[{"name":"AB線電壓","unit":"V","value":353.88,"time":"2019-05-08T01:54:58.129Z"},{"name":"BC線電壓","unit":"V","value":354.33,"time":"2019-05-08T01:54:58.129Z"},{"name":"CA線電壓","unit":"V","value":352.75,"time":"2019-05-08T01:54:58.129Z"},{"name":"A相電流","unit":"A","value":42,"time":"2019-05-08T01:54:58.129Z"},{"name":"B相電流","unit":"A","value":44.34,"time":"2019-05-08T01:54:58.129Z"},{"name":"C相電流","unit":"A","value":36,"time":"2019-05-08T01:54:58.129Z"},{"name":"有功功率","unit":"kW","value":21672,"time":"2019-05-08T01:54:58.129Z"},{"name":"無功功率","unit":"kvar","value":12378,"time":"2019-05-08T01:54:58.129Z"},{"name":"視在功率","unit":"kVA","value":24978,"time":"2019-05-08T01:54:58.130Z"},{"name":"功率因數","unit":"%","value":86.7,"time":"2019-05-08T01:54:58.130Z"},{"name":"有功電量","unit":"kWh","value":5952.35,"time":"2019-05-08T01:54:58.208Z"},{"name":"無功電量","unit":"kvarh","value":3993.59,"time":"2019-05-08T01:54:58.209Z"},{"name":"視在電量","unit":"kVAh","value":7223.13,"time":"2019-05-08T01:54:58.209Z"},{"name":"A相電流諧波比","unit":"%","value":[0.11,2.15,0,4.1,0.04,1.67,0,0.51,0,0.84,0,0.38,0,0.28,0,0.38,0,0.21,0,0.21,0,0.18,0,0.11,0,0.14,0,0.11,0,0.11],"time":"2019-05-08T01:54:58.304Z"},{"name":"B相電流諧波比","unit":"%","value":[0.1,1.27,0,4.17,0.04,1.6,0,0.26,0,0.72,0,0.47,0,0.07,0,0.32,0,0.29,0,0.04,0,0.13,0,0.16,0,0.1,0,0.04,0,0.1],"time":"2019-05-08T01:54:58.400Z"},{"name":"C相電流諧波比","unit":"%","value":[0.13,0.92,0.05,4.74,0.05,2.28,0,0.34,0,0.87,0,0.54,0,0.22,0,0.5,0,0.26,0,0.13,0,0.38,0,0.22,0,0.13,0,0.3,0,0.17],"time":"2019-05-08T01:54:58.495Z"},{"name":"A相電壓諧波比","unit":"%","value":[0.02,0.22,0.02,0.45,0.02,0.25,0,0.26,0.02,0.23,0.02,0.06,0.02,0.13,0.02,0.15,0.02,0.07,0.02,0.11,0.02,0.03,0.02,0.09,0.02,0.09,0,0.02,0.02,0.08],"time":"2019-05-08T01:54:58.592Z"},{"name":"B相電壓諧波比","unit":"%","value":[0.02,0.12,0.02,0.43,0.02,0.26,0.02,0.21,0.02,0.25,0.02,0.12,0.02,0.07,0.02,0.21,0.03,0.12,0.02,0.04,0.02,0.15,0.03,0.13,0.02,0.06,0.02,0.1,0.02,0.07],"time":"2019-05-08T01:54:58.688Z"},{"name":"C相電壓諧波比","unit":"%","value":[0.02,0.13,0.03,0.3,0,0.37,0.02,0.24,0.03,0.08,0.02,0.21,0.02,0.08,0.03,0.07,0.02,0.16,0.02,0.06,0.02,0.09,0.02,0.16,0,0.1,0.02,0.06,0.02,0.12],"time":"2019-05-08T01:54:58.784Z"}]}]}]
// [{"_id":"5cda4e66bc7583589fbb9204","name":"Geo9","logTime":"2019-05-14T05:13:10.871Z","reads":[{"name":"發電機300kVA","addr":71,"reads":[{"name":"頻率","unit":"Hz","value":0,"time":"2019-05-14T05:13:09.337Z"}]},{"name":"併接點","addr":72,"reads":[{"name":"AB線電壓","unit":"V","value":391.86,"time":"2019-05-14T05:13:09.448Z"},{"name":"BC線電壓","unit":"V","value":391.46,"time":"2019-05-14T05:13:09.448Z"},{"name":"CA線電壓","unit":"V","value":391.27,"time":"2019-05-14T05:13:09.448Z"},{"name":"A相電流","unit":"A","value":4.32,"time":"2019-05-14T05:13:09.448Z"},{"name":"B相電流","unit":"A","value":12.06,"time":"2019-05-14T05:13:09.448Z"},{"name":"C相電流","unit":"A","value":3,"time":"2019-05-14T05:13:09.448Z"},{"name":"有功功率","unit":"W","value":-3666,"time":"2019-05-14T05:13:09.448Z"},{"name":"無功功率","unit":"var","value":-1512,"time":"2019-05-14T05:13:09.448Z"},{"name":"視在功率","unit":"VA","value":4368,"time":"2019-05-14T05:13:09.448Z"},{"name":"功率因數","unit":"%","value":-83.9,"time":"2019-05-14T05:13:09.449Z"},{"name":"頻率","unit":"Hz","value":59.967,"time":"2019-05-14T05:13:09.449Z"},{"name":"正有功電量","unit":"kWh","value":4731.24,"time":"2019-05-14T05:13:09.529Z"},{"name":"負有功電量","unit":"kWh","value":323.29,"time":"2019-05-14T05:13:09.529Z"},{"name":"正無功電量","unit":"kvarh","value":51.58,"time":"2019-05-14T05:13:09.529Z"},{"name":"負無功電量","unit":"kvarh","value":476.73,"time":"2019-05-14T05:13:09.529Z"},{"name":"有功電量","unit":"kWh","value":5054.53,"time":"2019-05-14T05:13:09.529Z"},{"name":"無功電量","unit":"kvarh","value":528.31,"time":"2019-05-14T05:13:09.529Z"},{"name":"視在電量","unit":"kVAh","value":5255.28,"time":"2019-05-14T05:13:09.529Z"},{"name":"A相電流諧波比","unit":"%","value":[0.33,2.56,0,0.33,0,0.33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:09.625Z"},{"name":"B相電流諧波比","unit":"%","value":[0.67,1.21,0.12,0.34,0,0.12,0,0.12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:09.721Z"},{"name":"C相電流諧波比","unit":"%","value":[0,3.79,0,0.49,0,0.96,0,0.49,0,0,0,0.49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:09.819Z"},{"name":"A相電壓諧波比","unit":"%","value":[0,0.03,0.02,0.1,0.02,0.07,0,0.02,0,0.04,0,0.02,0,0.03,0,0.02,0,0.02,0,0.02,0,0.02,0,0.02,0,0.02,0,0.03,0,0.02],"time":"2019-05-14T05:13:09.912Z"},{"name":"B相電壓諧波比","unit":"%","value":[0,0.05,0,0.12,0,0.07,0,0.03,0,0.03,0,0.03,0,0.02,0.02,0.02,0,0.02,0,0.02,0,0,0,0.02,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.008Z"},{"name":"C相電壓諧波比","unit":"%","value":[0,0.05,0.02,0.11,0,0.08,0,0.03,0,0.04,0,0,0,0.02,0,0.02,0,0.02,0,0,0,0.02,0,0.02,0,0,0,0.03,0,0],"time":"2019-05-14T05:13:10.104Z"}]},{"name":"發電機300kVA","addr":73,"reads":[{"name":"AB線電壓","unit":"V","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"BC線電壓","unit":"V","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"CA線電壓","unit":"V","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"A相電流","unit":"A","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"B相電流","unit":"A","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"C相電流","unit":"A","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"有功功率","unit":"W","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"無功功率","unit":"var","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"視在功率","unit":"VA","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"功率因數","unit":"%","value":0,"time":"2019-05-14T05:13:10.216Z"},{"name":"正有功電量","unit":"kWh","value":6525.48,"time":"2019-05-14T05:13:10.297Z"},{"name":"負有功電量","unit":"kWh","value":0.02,"time":"2019-05-14T05:13:10.297Z"},{"name":"正無功電量","unit":"kvarh","value":4291.96,"time":"2019-05-14T05:13:10.297Z"},{"name":"負無功電量","unit":"kvarh","value":2.7,"time":"2019-05-14T05:13:10.297Z"},{"name":"有功電量","unit":"kWh","value":6525.5,"time":"2019-05-14T05:13:10.297Z"},{"name":"無功電量","unit":"kvarh","value":4294.66,"time":"2019-05-14T05:13:10.297Z"},{"name":"視在電量","unit":"kVAh","value":7871.96,"time":"2019-05-14T05:13:10.297Z"},{"name":"A相電流諧波比","unit":"%","value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.392Z"},{"name":"B相電流諧波比","unit":"%","value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.488Z"},{"name":"C相電流諧波比","unit":"%","value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.584Z"},{"name":"A相電壓諧波比","unit":"%","value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.679Z"},{"name":"B相電壓諧波比","unit":"%","value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.776Z"},{"name":"C相電壓諧波比","unit":"%","value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"time":"2019-05-14T05:13:10.871Z"}]}]}]
