// Initializes the `blob` service on path `/blob`
const createService = require('feathers-mongodb')
const hooks = require('./blob.hooks')
// !code: imports
// const $jsonSchema = require('./images.mongo')
require('dotenv').config()
const path = require('path')
const multer = require('multer')
// !end
// !code: init
const multerMemory = multer()
// !end

const moduleExports = async function (app) {
  const db = await app.get('mongoClient')
  const Model = await db.collection('blob', {
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
    '/blob',
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
    function (req, res, next) {
      const { hook: context } = res
      const { params, result } = context
      const { raw } = params
      const { key } = result
      if (raw) {
        const file = path.resolve(process.env.UPLOAD_PATH, key)
        res.sendFile(file)
      } else {
        next()
      }
    }
  )
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('blob')

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
