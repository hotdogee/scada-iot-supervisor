// A hook that logs service method before, after and error
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

module.exports = function () {
  return function (hook) {
    let message = `${hook.type}: ${hook.path} - Method: ${hook.method}`

    if (hook.type === 'error') {
      if (hook.error) {
        if (hook.error.name) {
          message += `: ${hook.error.name}`
        }
        if (hook.error.message) {
          message += `: ${hook.error.message}`
        }
        if (hook.data && hook.data.name) {
          message += `: ${hook.data.name}`
        }
      }
      logger.error(message)
    }
    else {
      logger.info(message)
    }

    logger.debug('hook.data', hook.data)
    logger.debug('hook.params', hook.params)
    if (hook.result) {
      logger.debug('hook.result', hook.result)
    }
  };
};
