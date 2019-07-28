// Hooks for service `images`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { authenticate } = require('@feathersjs/authentication').hooks
const { ObjectID } = require('mongodb')
// !code: imports
// const crypto = require('crypto')
const dauria = require('dauria')
// const mimeTypes = require('mime-types')
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
} = require('./images.validate')
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
  // support three ways of receiving data
  // 1. data.uri: data URI of the blob
  // 2. data.buffer: raw data buffer of the blob
  //    data.contentType: MIME type
  // 3. multipart/form-data.file: single file upload
  return async (context) => {
    const {
      app,
      data: { uri, buffer, contentType, originalName },
      params: { provider, file }
    } = context
    // check type === before, method === create
    checkContext(context, 'before', ['create'], 'saveToBlobStore')
    // send image data to blob service
    app.service('blob').create(
      {
        uri,
        buffer,
        contentType,
        originalName
      },
      { file }
    )
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
