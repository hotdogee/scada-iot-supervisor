const Ajv = require('ajv')
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
})

let data = {
  "name": "Home",
  "logTime": "2017-08-07T19:37:57.131Z",
  "reads": [
    {
      "name": "螢幕後",
      "addr": 1,
      "reads": [
        {
          "name": "壓力",
          "unit": "bar",
          "value": 1.0106672048568726,
          "time": "2017-08-07T19:37:56.652Z"
        },
        {
          "name": "溫度",
          "unit": "°C",
          "value": 28.785564422607422,
          "time": "2017-08-07T19:37:56.652Z"
        }
      ]
    },
    {
      "name": "市電",
      "addr": 2,
      "reads": [
        {
          "name": "功率",
          "unit": "kW",
          "value": 0.2271270751953125,
          "time": "2017-08-07T19:37:56.732Z"
        },
        {
          "name": "功因",
          "unit": "",
          "value": 0.957427978515625,
          "time": "2017-08-07T19:37:56.812Z"
        },
        {
          "name": "用電量",
          "unit": "kWh",
          "value": 582.640625,
          "time": "2017-08-07T19:37:56.892Z"
        },
        {
          "name": "電壓",
          "unit": "V",
          "value": 914.4375,
          "time": "2017-08-07T19:37:56.972Z"
        },
        {
          "name": "電流",
          "unit": "A",
          "value": 2.0416259765625,
          "time": "2017-08-07T19:37:57.052Z"
        }
      ]
    },
    {
      "name": "市電",
      "addr": 64,
      "reads": [
        {
          "name": "頻率",
          "unit": "Hz",
          "value": 59.9,
          "time": "2017-08-07T19:37:57.131Z"
        }
      ]
    }
  ]
}

let schema = {
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
const validate = ajv.compile(schema)
const valid = validate(data)
logger.info(data.logTime.toString())
logger.info(data.reads[0].reads[0].time.toString())
if (valid) {
  logger.info('log data is valid')
} else {
  logger.info('log data is INVALID!')
  logger.info(validate.errors)
}
