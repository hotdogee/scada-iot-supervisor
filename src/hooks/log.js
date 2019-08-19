// A hook that logs service method before, after and error
// See https://github.com/winstonjs/winston for documentation
// about the logger.
const logger = require('../logger')
const pick = require('lodash.pick')
// const merge = require('lodash.merge')
const safeStringify = require('fast-safe-stringify')

function safePick (o, ...k) {
  return JSON.parse(safeStringify(pick(o, ...k)))
}

function safeContext (context) {
  const c = safePick(
    context,
    'type',
    'method',
    'path',
    'params',
    'id',
    'data',
    'result',
    'error'
  )
  if (c.error) {
    c.error = safePick(
      context.error,
      'message',
      'name',
      'stack',
      'type',
      'className',
      'code',
      'data',
      'errors'
    )
  }
  return c
}

module.exports = function (msg) {
  return (context) => {
    const { method, type, path, params, error } = context
    const provider = params.provider ? params.provider : 'server'
    // const clientIp = params.clientIp || params.restAddress || ''
    const strategy = params.authentication
      ? params.authentication.strategy
      : 'anonymous'
    const prefix = `${provider}-${type}-${method}-${path}${
      params.provider ? '-' + strategy : ''
    }`.toUpperCase()
    if (msg) {
      logger.info(msg, {
        label: `=== ${prefix} ===`
      })
      return context
    }
    if (type === 'before') {
      context.logger = (label = '') => {
        return Object.keys(logger.levels).reduce((acc, l) => {
          acc[l] = (...args) => {
            logger[l](...args, {
              // === REST-BEFORE-CREATE-IMAGES-JWT (assertAlbumLimit) ===
              label: `=== ${prefix}${label ? ' (' + label + ')' : ''} ===`
            })
          }
          return acc
        }, {})
      }
    }
    if (!error) {
      logger.silly('', {
        label: `=== ${prefix} ===`,
        [Symbol.for('hook')]: safeContext(context)
      })
    } else {
      // logger.error(`=== ${prefix} ===`, safeError(context))
      logger.error(
        `${context.error && context.error.name}: ${context.error &&
          context.error.message}`,
        {
          label: `=== ${prefix} ===`,
          [Symbol.for('hook')]: safeContext(context)
        }
      )
    }
    return context
  }
}
