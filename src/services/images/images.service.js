// Initializes the `images` service on path `/images`
const createService = require('feathers-mongodb')
const hooks = require('./images.hooks')
// !code: imports
// const $jsonSchema = require('./images.mongo')
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const multer = require('multer')
// !end
// !code: init
const multerMemory = multer()
const supportedImageFormats = new Set(['jpg', 'png', 'webp', 'tiff', 'jpeg'])
// !end

const moduleExports = async function (app) {
  const db = await app.get('mongoClient')
  const Model = await db.collection('images', {
    // !<DEFAULT> code: create_collection
    // validator: { $jsonSchema: $jsonSchema },
    // validationLevel: 'strict', // The MongoDB default
    // validationAction: 'error', // The MongoDB default
    // !end
  })
  const paginate = app.get('paginate')
  // !<DEFAULT> code: func_init
  const options = { Model, paginate, whitelist: ['$client'], multi: false }
  // !end

  // Initialize our service with any options it requires
  // !code: extend
  app.use(
    '/images',
    // req.body = { data: { type: 'embryo', id: '1' } }
    // function (req, res, next) {
    //   console.log('req', req)
    //   console.log('req.files', req.files)
    //   next()
    // },
    // req.body { type: 'image', metadata: { name: 'cam1' } }
    // req.files {
    //   file: [
    //     {
    //       fieldname: 'file',
    //       originalname: 'cam1.jpg',
    //       encoding: '7bit',
    //       mimetype: 'image/jpeg',
    //       buffer: [Object],
    //       size: 174304
    //     }
    //   ]
    // }
    multerMemory.fields([{ name: 'file', maxCount: 1 }]),
    // transfer req.files by multer to feathers params
    function (req, res, next) {
      // app.info('req.files', req.files)
      // app.info('req.body', req.body)
      if (req.files && Array.isArray(req.files.file)) {
        req.feathers.file = req.files.file[0]
      }
      next()
    },
    createService(options),
    // handle raw views
    // http://localhost:6001/images/5d409c9036a569744447825b?$client[raw]=1&$client[width]=600&$client[height]=700&$client[format]=webp
    function (req, res, next) {
      const { hook: context } = res
      // eslint-disable-next-line no-unused-vars
      const { app, params, result } = context
      const { raw, width, height, format } = params
      const { key } = result
      // app.debug(`handleRaw ${typeof width}, ${width}`) // string
      // app.debug(`handleRaw ${typeof height}, ${height}`) // string
      // app.debug(`handleRaw ${typeof format}, ${format}`) // string
      if (raw) {
        // app.debug(`handleRaw`, params)
        const file = path.resolve(process.env.UPLOAD_PATH, key)
        // app.debug(`handleRaw ${typeof file}, ${file}`) // string
        // parse params
        const w = parseInt(width) || undefined
        const h = parseInt(height) || undefined
        const f = supportedImageFormats.has(format) ? format : undefined
        if (w || h || f) {
          let transform = sharp()
          if (w || h) {
            transform = transform.resize(w, h)
          }
          if (f) {
            transform = transform.toFormat(f)
          }
          res.type(f || path.extname(key))
          fs.createReadStream(file)
            .pipe(transform)
            .pipe(res)
        } else {
          res.sendFile(file)
        }
      } else {
        next()
      }
    }
  )
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('images')

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
