// Hooks for service `images`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
// const { authenticate } = require('@feathersjs/authentication').hooks
const { ObjectID } = require('mongodb')
// !code: imports
/* eslint-disable no-unused-vars */
// const crypto = require('crypto')
const dauria = require('dauria')
// const mimeTypes = require('mime-types')
const fsBlobStore = require('fs-blob-store')
const { omit } = require('lodash')
const { timestamp, assertDate } = require('../../hooks/common')
/* eslint-enables no-unused-vars */
// !end

// !code: used
/* eslint-disable no-unused-vars */
const { iff, mongoKeys, checkContext } = commonHooks
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
    all: [
      // authenticate('jwt')
    ],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [],
    create: [
      saveToBlobStore(),
      assertDate('timestamp'),
      timestamp('created'),
      timestamp('updated')
    ],
    update: [assertDate('timestamp'), timestamp('updated')],
    patch: [assertDate('timestamp'), timestamp('updated')],
    remove: []
    // !end
  },

  after: {
    // !<DEFAULT> code: after
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
function saveToBlobStore (store = fsBlobStore('./uploads')) {
  // there are three ways of receiving blob data
  // 1. multipart/form-data.file: single file upload
  // 2. data.uri: data URI of the blob
  // 3. data.buffer: raw data buffer of the blob
  //    data.contentType: MIME type, string: 'image/jpeg'
  //    data.originalName: string
  return async (context) => {
    const { app, data, params } = context
    const { uri, buffer, contentType, originalName } = data
    const { file } = params
    // check type === before, method === create
    checkContext(context, 'before', ['create'], 'saveToBlobStore')
    // send image data to blob service and receive key
    const { _id: key } = await app.service('blob').create(
      {
        uri,
        buffer,
        contentType,
        originalName
      },
      { file }
    )
    // add blob key and remove fields from client
    context.data = Object.assign(
      omit(data, ['uri', 'buffer', 'contentType', 'originalName']),
      { key }
    )
    context.params = omit(params, ['file'])
    return context
  }
}

function addToAlbum () {
  // there are three ways of receiving blob data
  // 1. multipart/form-data.file: single file upload
  // 2. data.uri: data URI of the blob
  // 3. data.buffer: raw data buffer of the blob
  //    data.contentType: MIME type, string: 'image/jpeg'
  //    data.originalName: string
  return async (context) => {
    const { app, data, params } = context
    const { uri, buffer, contentType, originalName } = data
    const { file } = params
    // check type === before, method === create
    checkContext(context, 'before', ['create'], 'saveToBlobStore')
    // send image data to blob service and receive key
    const { _id: key } = await app.service('blob').create(
      {
        uri,
        buffer,
        contentType,
        originalName
      },
      { file }
    )
    // add blob key and remove fields from client
    context.data = Object.assign(
      omit(data, ['uri', 'buffer', 'contentType', 'originalName']),
      { key }
    )
    context.params = omit(params, ['file'])
    return context
  }
}
// !end
// !code: end // !end
