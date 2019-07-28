// Initializes the `images` service on path `/images`
const createService = require('feathers-mongodb')
const hooks = require('./images.hooks')
// !code: imports
// const $jsonSchema = require('./images.mongo')
const multer = require('multer')
// !end
// !code: init
const multerMemory = multer()
// !end

const moduleExports = function (app) {
  const paginate = app.get('paginate')
  const mongoClient = app.get('mongoClient')
  const options = { paginate }
  // !code: func_init // !end

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
    createService(options)
  )
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('images')

  // eslint-disable-next-line no-unused-vars
  const promise = mongoClient
    .then((db) => {
      return db.createCollection('images', {
        // !<DEFAULT> code: create_collection
        // validator: { $jsonSchema: $jsonSchema },
        // validationLevel: 'strict', // The MongoDB default
        // validationAction: 'error', // The MongoDB default
        // !end
      })
    })
    .then((serviceModel) => {
      service.Model = serviceModel
    })

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
