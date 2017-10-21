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

const interval = 1000 * 60 * 15

MongoClient.connect(config.get('mongodb')).then(db => {
  const logs = db.collection('logs')
  logs.aggregate([
    { $project: {
      logTime: new Date('$logTime')
    }},
    { $group: {
      _id: {
        date:  '$logTime'
      },
      count: { $sum: 1 }
    }}
  ]).limit(2).toArray().then(documents => {
    logger.debug(documents)
    process.exit()
  });
});
