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
const { timestamp, assertDateOrSetNow } = require('../../hooks/common')
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
const foreignKeys = ['_id', 'albumId']
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
      // debugLogger(),
      assertAlbum(),
      saveToBlobStore(),
      assertAlbumDeduplicate(),
      assertDateOrSetNow('timestamp'),
      timestamp('created'),
      timestamp('updated')
    ],
    update: [assertDateOrSetNow('timestamp'), timestamp('updated')],
    patch: [assertDateOrSetNow('timestamp'), timestamp('updated')],
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
function debugLogger () {
  // add imageId to album
  return async (context) => {
    const { app } = context
    // app.debug('debugLogger', { this: this })
    // const this = {
    //   global: '[Circular]',
    //   '__core-js_shared__': {
    //     versions: [
    //       {
    //         version: '2.6.9',
    //         mode: 'pure',
    //         copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
    //       }
    //     ],
    //     wks: {},
    //     keys: { IE_PROTO: 'Symbol(IE_PROTO)_2.ie07yv3jwl' },
    //     'symbol-registry': {},
    //     symbols: {},
    //     'op-symbols': {}
    //   },
    //   locale: 'en'
    // }
    app.debug('debugLogger', { context })
    // const context = {
    //   type: 'before',
    //   method: 'create',
    //   path: 'images',
    //   params: {
    //     query: {},
    //     route: {},
    //     provider: 'rest',
    //     headers: {
    //       host: 'localhost:8081',
    //       authorization:
    //         'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNzgyNjEsImV4cCI6MTg4MDk1NDI2MSwiYXVkIjoiYXBpLWtleSIsImlzcyI6ImhhbmwuaW4iLCJzdWIiOiI1ZDRkODYwYjA5YjlkMTNhZmM2ZDIzZWUifQ.JXRxPXXL366NxyER8_Hnc8ORRDlpKoOh5dRtJZNGWWA',
    //       accept: 'application/json',
    //       'content-type':
    //         'multipart/form-data; boundary=--------------------------387244591272783150385596',
    //       'content-length': '174772',
    //       connection: 'close'
    //     },
    //     authentication: {
    //       strategy: 'jwt',
    //       accessToken:
    //         'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNzgyNjEsImV4cCI6MTg4MDk1NDI2MSwiYXVkIjoiYXBpLWtleSIsImlzcyI6ImhhbmwuaW4iLCJzdWIiOiI1ZDRkODYwYjA5YjlkMTNhZmM2ZDIzZWUifQ.JXRxPXXL366NxyER8_Hnc8ORRDlpKoOh5dRtJZNGWWA',
    //       payload: {
    //         iat: 1565378261,
    //         exp: 1880954261,
    //         aud: 'api-key',
    //         iss: 'hanl.in',
    //         sub: '5d4d860b09b9d13afc6d23ee'
    //       }
    //     },
    //     clientIp: '::ffff:127.0.0.1',
    //     restAddress: '::ffff:127.0.0.1',
    //     file: {
    //       fieldname: 'file',
    //       originalname: 'cam1.jpg',
    //       encoding: '7bit',
    //       mimetype: 'image/jpeg',
    //       buffer: {
    //         type: 'Buffer',
    //         data: [255]
    //       },
    //       size: 174304
    //     },
    //     user: {
    //       _id: '5d4d860b09b9d13afc6d23ee',
    //       accounts: [
    //         {
    //           type: 'email',
    //           value: 'hotdogee@gmail.com',
    //           verified: '2019-08-09T14:52:41.732Z'
    //         }
    //       ],
    //       password:
    //         '$2a$10$4CPRGVRUgcpAAfAWxV9J3eB6S8ClJZHmrJYIAM4POM1vHzBgikWIi',
    //       language: 'en',
    //       country: 'tw',
    //       created: '2019-08-09T14:41:15.799Z',
    //       updated: '2019-08-09T14:52:41.737Z',
    //       authorizations: [
    //         {
    //           org: 'hanl.in',
    //           role: 'admin'
    //         }
    //       ]
    //     },
    //     authenticated: true,
    //     ability: {}
    //   },
    //   data: {
    //     timestamp: '2019-08-10T17:50:01.836Z',
    //     albumId: '5d435c1fb73082687c8797a6'
    //   }
    // }
    return context
  }
}

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
  // sets data.key after blob is created
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
  // if data.albumId is given
  // throw error if album not found
  // set params.album if album exists for downstream hooks to use
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
      data.albumId = new ObjectID(albumId)
      app.info(`typeof data.albumId = ${typeof data.albumId}, ${data.albumId}`)
    }
    return context
  }
}

function assertAlbumDeduplicate () {
  // if params.album.deduplication
  // if image with the same albumId and key exists
  // set context.result = image
  return async (context) => {
    // check type === before, method === 'create', 'update', 'patch'
    checkContext(
      context,
      'before',
      ['create', 'update', 'patch'],
      'assertAlbumDeduplicate'
    )
    const { service, data, params } = context
    const { album } = params
    if (!album) return context
    const { _id: albumId, deduplication } = album
    if (!deduplication) return context
    const { key } = data
    const {
      total,
      data: [image]
    } = await service.find({
      query: {
        albumId,
        key
      }
    })
    if (total > 0) {
      context.result = image
    }
    return context
  }
}

function assertAlbumLimit () {
  // if params.album.keep
  // get album images sorted by ascending timestamp
  // remove old images over keep limit
  // supports paginate
  return async (context) => {
    // check type === after, method === 'create', 'update', 'patch'
    checkContext(
      context,
      'after',
      ['create', 'update', 'patch'],
      'addImageToAlbum'
    )
    const { service, params, logger } = context
    const log = logger('assertAlbumLimit')
    const { album } = params
    if (!album) return context
    const { _id: albumId, keep } = album
    if (!keep) return context
    // edge cases:
    // total > page limit
    // total - keep > page limit
    // sort ascending
    let { total, data: images } = await service.find({
      query: {
        albumId,
        $sort: {
          timestamp: 1
        }
      }
    })
    // in place sort descending, older images at end of array
    // images.sort(
    //   (a, b) =>
    //     new Date(b.timestamp || b.updated) - new Date(a.timestamp || a.updated)
    // )
    log.debug(`before total ${total} ${keep}`)
    if (total > keep) {
      total -= (await Promise.all(
        images.slice(0, total - keep).map(({ _id: imageId }) => {
          service.remove(imageId)
        })
      )).length
    }
    log.debug(`after total ${total} ${keep}`)
    while (total > keep) {
      const result = await service.find({
        query: {
          albumId,
          $sort: {
            timestamp: 1
          }
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
