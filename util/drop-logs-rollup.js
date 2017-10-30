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


const mongodb = process.env.MONGODB || config.get('mongodb')
logger.info(`Using: ${mongodb}`)
MongoClient.connect(mongodb).then(async db => {
  for (b in buckets) {
    let reply = await db.collection(`logs.sanitized.${b}`).drop()
    logger.info(reply)
  }
  db.close()
})
