// Logger. (Can be re-generated.)
const { createLogger, format, transports } = require('winston')
const { inspect } = require('util')
const colors = require('colors/safe')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')
// !code: imports // !end
// !<DEFAULT> code: init
const levelColors = {
  error: 'red',
  debug: 'blue',
  warn: 'yellow',
  data: 'grey',
  info: 'green',
  verbose: 'cyan',
  silly: 'magenta',
  custom: 'yellow'
}
const formatConsole = format((info, opts = {}) => {
  const stringifiedRest = jsonStringify(
    Object.assign({}, info, {
      level: undefined,
      message: undefined,
      timestamp: undefined,
      ms: undefined,
      splat: undefined
    })
  )

  const label = (info.label && `${info.label} `) || ''
  let colorize = colors['white']
  if (!label && info.level && levelColors[info.level]) {
    colorize = colors[levelColors[info.level]]
  }
  const level = colorize(info.level)
  const ms = colorize(info.ms)
  const time = new Date(info.timestamp)
  const tzoffset = time.getTimezoneOffset() * 60000 // offset in milliseconds
  const localISOTime = colorize(
    new Date(time - tzoffset).toISOString().slice(0, -1)
  )
  const padding = (info.padding && info.padding[info.level]) || ''
  if (stringifiedRest !== '{}') {
    const rest = inspect(JSON.parse(stringifiedRest), false, 2, true)
    info[MESSAGE] = `${localISOTime} ${label}${level} ${padding} ${
      info.message
    } ${rest} ${ms}`
  } else {
    info[MESSAGE] = `${localISOTime} ${label}${level} ${padding} ${
      info.message
    } ${ms}`
  }

  return info
})
// !end

// Configure the Winston logger. For the complete documentation seee https://github.com/winstonjs/winston
const moduleExports = createLogger({
  // !<DEFAULT> code: level
  // To see more detailed errors, change this to debug'
  level: 'debug',
  // !end
  // !code: format // !end
  // !<DEFAULT> code: transport
  transports: [
    new transports.Console({
      format: format.combine(
        format.splat(),
        format.timestamp(),
        format.ms(),
        format.padLevels(),
        formatConsole()
      )
    })
  ]
  // !end
  // !code: moduleExports // !end
})

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
