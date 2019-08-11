// Logger. (Can be re-generated.)
/* eslint-disable no-unused-vars */
const { omit, pick } = require('lodash')
const { createLogger, format, transports } = require('winston')
// const { inspect } = require('util')
const colors = require('colors/safe')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')
const serializeError = require('serialize-error')
// const prettier = require('prettier-eslint')
const colorize = require('json-colorizer')
/* eslint-enables no-unused-vars */
// !code: imports // !end
// !<DEFAULT> code: init
const levelColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'green',
  verbose: 'grey',
  debug: 'cyan',
  silly: 'magenta'
}
const logInfo = format((info, opts = {}) => {
  // console.log('===DEBUG=== logInfo this', this)
  // console.log('===DEBUG=== logInfo info', info)
  // console.log('===DEBUG=== logInfo opts', opts)
  return info
})
const consoleHook = format((info, opts = {}) => {
  if (process.env.NODE_ENV === 'production') {
    Object.assign(info, pick(info[Symbol.for('hook')], ['message', 'stack']))
  } else {
    Object.assign(
      info,
      omit(info[Symbol.for('hook')], ['type', 'method', 'path'])
    )
  }
  return info
})
const formatConsole = format((info, opts = {}) => {
  // serialize Errors
  // console.log('===DEBUG===', info, typeof info)
  if (info instanceof Error) {
    info = Object.assign({}, info, serializeError(info))
    if (info.hook) {
      info.hook = omit(info.hook, ['service', 'app', 'arguments'])
    }
  }
  // info.params.file.buffer.data =
  // let stringifiedRest
  // try {
  //   stringifiedRest = prettier({
  //     logLevel: 'warn',
  //     eslintConfig: {
  //       env: {
  //         node: true,
  //         es6: true,
  //         mocha: true
  //       },
  //       extends: 'standard',
  //       globals: {
  //         Atomics: 'readonly',
  //         SharedArrayBuffer: 'readonly',
  //         btoa: 'readonly',
  //         atob: 'readonly'
  //       },
  //       parserOptions: {
  //         ecmaVersion: 2018
  //       },
  //       rules: {
  //         'quote-props': ['error', 'as-needed'],
  //         'space-before-function-paren': ['error', 'always']
  //       }
  //     },
  //     prettierOptions: {
  //       trailingComma: 'none',
  //       tabWidth: 2,
  //       semi: false,
  //       singleQuote: true,
  //       parser: 'babel',
  //       arrowParens: 'always'
  //     },
  //     text:
  //       'a=' +
  //       jsonStringify(
  //         Object.assign({}, info, {
  //           level: undefined,
  //           label: undefined,
  //           message: undefined,
  //           timestamp: undefined,
  //           ms: undefined,
  //           splat: undefined
  //         }),
  //         (key, value) => {
  //           // console.log('Key:', JSON.stringify(key), 'Value:', JSON.stringify(value))
  //           // Remove the circular structure
  //           if (key === 'data' && Array.isArray(value)) {
  //             return
  //           }
  //           return value
  //         }
  //       )
  //   }).slice(4)
  // } catch (error) {
  //   console.log('========ERROR==========', error)
  //   stringifiedRest = inspect(
  //     JSON.parse(
  //       jsonStringify(
  //         Object.assign({}, info, {
  //           level: undefined,
  //           label: undefined,
  //           message: undefined,
  //           timestamp: undefined,
  //           ms: undefined,
  //           splat: undefined
  //         })
  //       )
  //     ),
  //     {
  //       compact: true,
  //       depth: 5,
  //       breakLength: 200,
  //       colors: true
  //     }
  //   )
  // }

  const stringifiedRest = colorize(
    jsonStringify(
      Object.assign({}, info, {
        level: undefined,
        label: undefined,
        message: undefined,
        timestamp: undefined,
        ms: undefined,
        splat: undefined
      }),
      (key, value) => {
        // console.log('Key:', JSON.stringify(key), 'Value:', JSON.stringify(value))
        // Remove the circular structure
        if (key === 'data' && Array.isArray(value)) {
          return
        }
        return value
      }
    ),
    {
      pretty: true,
      colors: {
        BRACE: 'gray',
        BRACKET: 'gray',
        COLON: 'gray',
        COMMA: 'gray',
        STRING_KEY: 'white',
        STRING_LITERAL: 'green',
        NUMBER_LITERAL: 'yellowBright',
        BOOLEAN_LITERAL: 'red',
        NULL_LITERAL: 'red'
      }
    }
  )
  // const stringifiedRest = jsonStringify(
  //   Object.assign({}, info, {
  //     level: undefined,
  //     label: undefined,
  //     message: undefined,
  //     timestamp: undefined,
  //     ms: undefined,
  //     splat: undefined
  //   })
  // )
  // console.log('stringifiedRest', info)
  // console.log(
  //   'stringifiedRest',
  //   Object.assign({}, info, {
  //     level: undefined,
  //     message: undefined,
  //     timestamp: undefined,
  //     ms: undefined,
  //     splat: undefined
  //   })
  // )
  // console.log('stringifiedRest', stringifiedRest)

  const label = info.label
  let color = colors['white']
  if (info.level && levelColors[info.level]) {
    color = colors[levelColors[info.level]]
  }
  const level = color(info.level)
  const ms = color(info.ms)
  const time = new Date(info.timestamp)
  const tzoffset = time.getTimezoneOffset() * 60000 // offset in milliseconds
  const localISOTime = color(
    new Date(time - tzoffset).toISOString().slice(0, -1)
  )
  // const padding = (info.padding && info.padding[info.level]) || ''
  // if (stringifiedRest !== '{}') {
  //   const rest = inspect(JSON.parse(stringifiedRest), {
  //     compact: true,
  //     depth: 5,
  //     breakLength: 200,
  //     colors: true
  //   })
  //   info[MESSAGE] = `${localISOTime} ${level}${label ? ' ' + label : ''}${
  //     info.message ? ' ' + info.message + ' ' : ''
  //   }\n${rest} ${ms}`
  // } else {
  //   info[MESSAGE] = `${localISOTime} ${level}${label ? ' ' + label : ''}${
  //     info.message ? ' ' + info.message : ''
  //   } ${ms}`
  // }

  info[MESSAGE] = `${localISOTime} ${level}${label ? ' ' + label : ''}${
    info.message ? ' ' + info.message + ' ' : ''
  }${
    stringifiedRest === '\u001b[90m{\u001b[39m\u001b[90m}\u001b[39m'
      ? ''
      : '\n' + stringifiedRest
  } ${ms}`

  return info
})
// !end

// Configure the Winston logger. For the complete documentation seee https://github.com/winstonjs/winston
const moduleExports = createLogger({
  // !<DEFAULT> code: level
  // To see more detailed errors, change this to debug'
  level: process.env.LOG_LEVEL || 'silly',
  // !end
  // !code: format
  format: format.combine(
    logInfo(),
    consoleHook(),
    format.splat(),
    format.timestamp(),
    format.ms(),
    format.padLevels(),
    formatConsole()
  ),
  // !end
  // !<DEFAULT> code: transport
  transports: [new transports.Console({})]
  // !end
  // !code: moduleExports // !end
})

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
