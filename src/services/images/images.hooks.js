// Hooks for service `images`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !<DEFAULT> code: auth_imports

/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
/* eslint-enables no-unused-vars */

// !end
// !code: imports
/* eslint-disable no-unused-vars */
// const crypto = require('crypto')
const dauria = require('dauria')
// const mimeTypes = require('mime-types')
const fsBlobStore = require('fs-blob-store')
const { omit, sortBy } = require('lodash')
const { timestamp, assertDateDefault } = require('../../hooks/common')
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
    // !code: before
    all: [
      // authenticate('jwt')
    ],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [
      paramsFromClient('raw', 'width', 'height', 'format')
      // handleRaw()
    ],
    create: [
      assertAlbum(),
      saveToBlobStore(),
      assertDateDefault('timestamp'),
      timestamp('created'),
      timestamp('updated')
    ],
    update: [assertDateDefault('timestamp'), timestamp('updated')],
    patch: [assertDateDefault('timestamp'), timestamp('updated')],
    remove: []
    // !end
  },

  after: {
    // !code: after
    all: [],
    find: [],
    get: [],
    create: [
      // addImageToAlbum()
      assertAlbumLimit()
    ],
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
function handleRaw () {
  return async (context) => {
    // check type === before, method === create
    checkContext(context, 'before', ['get'], 'handleRaw')
    const { app, params } = context
    const { raw } = params
    if (raw) {
      app.debug(`handleRaw`, params)
    }
    return context
  }
}

function saveToBlobStore (store = fsBlobStore('./uploads')) {
  // there are three ways of receiving blob data
  // 1. multipart/form-data.file: single file upload
  // 2. data.uri: data URI of the blob
  // 3. data.buffer: raw data buffer of the blob
  //    data.contentType: MIME type, string: 'image/jpeg'
  //    data.originalName: string
  return async (context) => {
    // check type === before, method === create
    checkContext(context, 'before', ['create'], 'saveToBlobStore')
    const { app, data, params } = context
    const { uri, buffer, contentType, originalName } = data
    const { file } = params
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

function assertAlbum () {
  // check if album exists
  return async (context) => {
    // check type === before, method === 'create', 'update', 'patch'
    checkContext(
      context,
      'before',
      ['create', 'update', 'patch'],
      'assertAlbum'
    )
    const { app, data, params } = context
    const { albumId } = data
    if (!albumId) return context
    // { total: 0, limit: 0, skip: 0, data: [] }
    const {
      total,
      data: [album]
    } = await app.service('albums').find({
      query: {
        _id: albumId
      }
    })
    if (total === 0) {
      throw new BadRequest({
        message: `albumId not found`,
        errors: {
          albumId: `albumId not found`
        }
      })
    } else {
      params.album = album
    }
    return context
  }
}

function assertAlbumLimit () {
  // add imageId to album
  return async (context) => {
    // check type === after, method === 'create', 'update', 'patch'
    checkContext(
      context,
      'after',
      ['create', 'update', 'patch'],
      'addImageToAlbum'
    )
    const { app, service, params } = context
    const { album } = params
    if (!album) return context
    const { _id: albumId, keep } = album
    if (!keep) return context
    // edge cases:
    // total > page limit
    // total - keep > page limit
    // sort ascending
    let { total, data: images } = await service.find({
      albumId,
      $sort: {
        timestamp: 1
      }
    })
    // in place sort descending, older images at end of array
    // images.sort(
    //   (a, b) =>
    //     new Date(b.timestamp || b.updated) - new Date(a.timestamp || a.updated)
    // )
    app.debug(`before total ${total} ${keep}`)
    if (total > keep) {
      total -= (await Promise.all(
        images.slice(0, total - keep).map(({ _id: imageId }) => {
          service.remove(imageId)
        })
      )).length
    }
    app.debug(`after total ${total} ${keep}`)
    while (total > keep) {
      const result = await service.find({
        albumId,
        $sort: {
          timestamp: 1
        }
      })
      total = result.total
      images = result.data
      total -= (await Promise.all(
        images.slice(0, total - keep).map(({ _id: imageId }) => {
          service.remove(imageId)
        })
      )).length
    }
    return context
  }
}

function addImageToAlbum () {
  // add imageId to album
  return async (context) => {
    // check type === after, method === 'create', 'update', 'patch'
    checkContext(
      context,
      'after',
      ['create', 'update', 'patch'],
      'addImageToAlbum'
    )
    const { app, params, result, id: imageId } = context
    const { albumId } = params
    if (!albumId) return context
    // { total: 0, limit: 0, skip: 0, data: [] }
    const image = {
      imageId,
      created: result.timestamp || result.updated
    }
    const album = await app.service('albums').patch(
      albumId,
      {},
      paramsForServer({
        image
      })
    )
    app.debug('addImageToAlbum album', album)
    return context
  }
}
// !end
// !code: end // !end
