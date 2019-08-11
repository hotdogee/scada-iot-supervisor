const MongoClient = require('mongodb').MongoClient;
const config = require('config')

const winston = require('winston')
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        // setup console logging with timestamps
        level: 'debug',
        timestamp: function() {
          return (new Date()).toISOString();
        },
        formatter: function(options) {
          return options.timestamp() + ' ' + options.level[0].toUpperCase() + ' ' + (options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta, null, 2) : '' );
        }
      })
    ]
});

let interval = 1000 * 60 * 15 // 15 min
interval = 1000 * 60 * 60 // 1 hour
interval = 1000 * 60 * 60 * 24 // 1 day

// aggregate on 1 day interval over 2,337,017 documentes took 4 mins
MongoClient.connect(config.get('mongodb')).then(db => {
  const logs = db.collection('logs')
  logs.aggregate([
    { $match: { name: 'Geo9' } },
    { $unwind: '$reads' },
    { $unwind: '$reads.reads' },
    { $group: {
      _id: {
        timeBucket: { $add: [
          { $subtract: [
            { $subtract: ['$logTime', new Date(0)] },
            { $mod: [{ $subtract: ['$logTime', new Date(0)] }, interval]}
          ] },
          new Date(0)
        ] },
        name: '$name',
        rtuName: '$reads.name',
        rtuAddr: '$reads.addr',
        regName: '$reads.reads.name',
        regAddr: '$reads.reads.unit',
      },
      count: { $sum: 1 },
      min: { $min: '$reads.reads.value' },
      max: { $max: '$reads.reads.value' },
      value: { $avg: '$reads.reads.value' },
      stdDevPop: { $stdDevPop: '$reads.reads.value' }
    }},
    { $group: {
      _id: {
        name: '$_id.name',
        timeBucket: '$_id.timeBucket',
        rtuName: '$_id.rtuName',
        rtuAddr: '$_id.rtuAddr'
      },
      name: { $first: '$_id.rtuName' },
      addr: { $first: '$_id.rtuAddr' },
      reads: { $push: {
        name: "$_id.regName",
        unit: "$_id.regAddr",
        count: "$count",
        min: "$min",
        max: "$max",
        value: "$value",
        stdDevPop: "$stdDevPop",
      } }
    }},
    { $group: {
      _id: {
        name: '$_id.name',
        timeBucket: '$_id.timeBucket'
      },
      name: { $first: '$_id.name' },
      logTime: { $first: '$_id.timeBucket' },
      reads: { $push: {
        name: "$name",
        addr: "$addr",
        reads: "$reads"
      } }
    }}
  ]).toArray().then(docs => {
    logger.debug(docs.length)
    process.exit()
  });
});
