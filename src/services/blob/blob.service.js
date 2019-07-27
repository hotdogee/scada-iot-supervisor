// Initializes the `blob` service on path `/blob`. (Can be re-generated.)
// !code: createService
const createService = require('feathers-blob')
// !end
const hooks = require('./blob.hooks')
// !code: imports
const multer = require('multer')
const fsBlobStore = require('fs-blob-store')
// !end
// !code: init
const multerMemory = multer()
const Model = fsBlobStore('./uploads')
// !end

const moduleExports = function (app) {
  const paginate = app.get('paginate')
  // !code: func_init // !end

  const options = {
    // !code: options_more
    Model,
    // !end
    paginate
  }
  // !code: options_change // !end

  // Initialize our service with any options it requires
  // !code: extend
  app.use('/blob',
    // req.body = { data: { type: 'embryo', id: '1' } }
    // req.files = { blob:
    //  [ { fieldname: 'blob',
    //  originalname: 'blob',
    //  encoding: '7bit',
    //  mimetype: 'image/png',
    //  buffer: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 01 2c 00 00 00 96 08 06 00 00 00 64 5b b5 d2 00 00 04 68 49 44 41 54 78 5e ed d4 81 09 00 30 0c ... >,
    //  size: 1185 } ] }
    // function (req, res, next) {
    //   console.log('req', req)
    //   console.log('req.files', req.files)
    //   next()
    // },
    multerMemory.fields([
      { name: 'file', maxCount: 1 }
    ]),
    // transfer the received file to feathers
    function (req, res, next) {
      app.info('req.files', req.files)
      app.info('req.body', req.body)
      req.feathers.file = req.files ? req.files.file[0] : ''
      next()
    },
    createService(options)
  )
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('blob')

  service.hooks(hooks)
  // !code: func_return // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
