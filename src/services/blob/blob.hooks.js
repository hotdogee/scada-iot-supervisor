// Hooks for service `blob`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { authenticate } = require('@feathersjs/authentication').hooks
const { ObjectID } = require('mongodb')
// !code: imports
const from = require('from2')
const crypto = require('crypto')
const dauria = require('dauria')
const mimeTypes = require('mime-types')
const fsBlobStore = require('fs-blob-store')
// !end

// !code: used
// eslint-disable-next-line no-unused-vars
const { iff, mongoKeys, checkContext } = commonHooks
/* eslint-disable no-unused-vars */
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
const foreignKeys = []
// !end
// !code: init // !end

const moduleExports = {
  before: {
    // Your hooks should include:
    //   all   : authenticate('jwt')
    //   find  : mongoKeys(ObjectID, foreignKeys)
    // !<DEFAULT> code: before
    all: [authenticate('jwt')],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [],
    create: [saveToBlobStore(), fileToUri],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  after: {
    // !<DEFAULT> code: after
    all: [],
    find: [],
    get: [],
    create: [removeUri],
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
function saveToBlobStore (store = fsBlobStore('./uploads')) {
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
      service
    } = context
    // check type === before, method === create
    checkContext(context, 'before', ['create'], 'saveToBlobStore')
    // convert file or uri to buffer and contentType
    if (file) {
      const result = dauria.parseDataURI(uri)
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
      app.info(`saveToBlobStore found existing blob: ${key}`)
      return result
    } catch (error) {
      app.info(`saveToBlobStore creating new blob: ${key}`)
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
      _id: key
    }
    return context
  }
}

function fileToUri (context) {
  if (!context.data.uri && context.params.file) {
    // console.log(context.data)
    const file = context.params.file
    const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
    context.data.uri = uri
  }
}

function removeUri (context) {
  if (context.result && context.result.uri) {
    delete context.result.uri
  }
}
// !end
// !code: end // !end
