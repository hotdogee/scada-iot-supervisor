// A hook that logs service method before, after and error
// See https://github.com/winstonjs/winston for documentation
// about the logger.
const logger = require('../logger')
const pick = require('lodash.pick')
const merge = require('lodash.merge')
const safeStringify = require('fast-safe-stringify')

function safePick (o, ...k) {
  return JSON.parse(safeStringify(pick(o, ...k)))
}

function safeContext (context) {
  return safePick(
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
}

function safeError (context) {
  return merge(
    safeContext(context),
    safePick(
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
  )
}

module.exports = function () {
  return (context) => {
    if (!context.error) {
      logger.debug(
        `---${context.type.toUpperCase()} ${context.method.toUpperCase()} ${context.path.toUpperCase()}---`,
        safeContext(context)
      )
    } else {
      logger.error(
        `---${context.type.toUpperCase()} ${context.method.toUpperCase()} ${context.path.toUpperCase()}---`,
        safeError(context)
      )
    }
  }
}
