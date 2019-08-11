// Hooks for service `blob`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !<DEFAULT> code: auth_imports
/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
/* eslint-enables no-unused-vars */
// !end
// !code: imports
/* eslint-disable no-unused-vars */
require('dotenv').config()
const from = require('from2')
const crypto = require('crypto')
const dauria = require('dauria')
const mimeTypes = require('mime-types')
const fsBlobStore = require('fs-blob-store')
const { timestamp } = require('../../hooks/common')
/* eslint-enables no-unused-vars */
// !end

// !code: used
/* eslint-disable no-unused-vars */
const {
  FeathersError,
  BadRequest,
  NotAuthenticated,
  PaymentError,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  NotAcceptable,
  Timeout,
  Conflict,
  LengthRequired,
  Unprocessable,
  TooManyRequests,
  GeneralError,
  NotImplemented,
  BadGateway,
  Unavailable
} = require('@feathersjs/errors')
const {
  iff,
  mongoKeys,
  checkContext,
  paramsFromClient,
  paramsForServer
} = commonHooks
const {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch
} = require('./blob.validate')
/* eslint-enables no-unused-vars */
// !end
// !<DEFAULT> code: foreign_keys
// eslint-disable-next-line no-unused-vars
const foreignKeys = ['userId']
// !end
// !code: init
const uploadStore = fsBlobStore(process.env.UPLOAD_PATH)
// !end

const moduleExports = {
  before: {
    // Your hooks should include:
    //   all   : authenticate('jwt')
    //   find  : mongoKeys(ObjectID, foreignKeys)
    // !code: before
    all: [authenticate('jwt')],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [paramsFromClient('raw')],
    create: [saveToBlobStore(), timestamp('created'), timestamp('updated')],
    update: [timestamp('updated')],
    patch: [timestamp('updated')],
    remove: [removeFromBlobStore()]
    // !end
  },

  after: {
    // !code: after
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  error: {
    // !<DEFAULT> code: error
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
    // !<DEFAULT> code: moduleExports
  }
  // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs
function saveToBlobStore (store = uploadStore) {
  // de-duplication with key = `${hash}.${ext}`
  // there are three ways of receiving blob data
  // 1. multipart/form-data.file: single file upload
  // 2. data.uri: data URI of the blob
  // 3. data.buffer: raw data buffer of the blob
  //    data.contentType: MIME type, string: 'image/jpeg'
  //    data.originalName: string
  return async (context) => {
    let {
      app,
      data: { uri, buffer, contentType, originalName },
      params: { file },
      service,
      logger
    } = context
    // check type === before, method === create
    checkContext(context, 'before', ['create'], 'saveToBlobStore')
    const log = logger('saveToBlobStore')
    // convert file or uri to buffer and contentType
    if (file) {
      buffer = file.buffer
      contentType = file.mimetype
      originalName = file.originalname
    } else if (uri) {
      const result = dauria.parseDataURI(uri)
      buffer = result.buffer
      contentType = result.MIME
    }
    // compute key
    const hash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex') // length: 64
    const ext = mimeTypes.extension(contentType)
    const key = `${hash}.${ext}`
    // check if key exists
    try {
      const result = await service.get(key)
      log.info(`return existing blob: ${key}`)
      context.result = result
      return context
    } catch (error) {
      // app.info(`saveToBlobStore creating new blob: ${key}`)
    }
    // save to blob store
    await new Promise((resolve, reject) => {
      from(function (size, next) {
        if (buffer.length <= 0) {
          return this.push(null)
        }
        const chunk = buffer.slice(0, size)
        buffer = buffer.slice(size)
        next(null, chunk)
      })
        .pipe(
          store.createWriteStream(
            {
              key
            },
            (error) =>
              error
                ? reject(error)
                : resolve({
                  key
                })
          )
        )
        .on('error', reject)
    })
    // compose data to store in mongodb
    context.data = {
      _id: key,
      originalName
    }
    return context
  }
}

function removeFromBlobStore (store = uploadStore, services = ['images']) {
  // check related services: images
  return async (context) => {
    const {
      id: key,
      app,
      data: { uri, buffer, contentType, originalName },
      params: { file },
      service,
      logger
    } = context
    // check type === before, method === remove
    checkContext(context, 'before', ['remove'], 'removeFromBlobStore')
    const log = logger('removeFromBlobStore')
    const params = {
      query: {
        $limit: 0,
        key
      }
    }
    const refCount = services.reduce(async (p, s) => {
      const acc = await p
      const { total } = await app.service(s).find(params)
      return acc + total
    }, Promise.resolve(0))
    log.info(`refCount = ${refCount}`)
    if (refCount > 0) {
      // still being used, can not remove yet
      context.result = {
        _id: key,
        result: 'hold',
        refCount
      }
      return context
    }
    await new Promise((resolve, reject) => {
      store.remove(key, (error) =>
        error
          ? reject(error)
          : resolve({
            key
          })
      )
    })
    return context
  }
}
// !end
// !code: end // !end
