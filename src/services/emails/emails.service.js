// Initializes the `emails` service on path `/emails`
const createService = require('feathers-mongodb')
const hooks = require('./emails.hooks')
// !code: imports
// const $jsonSchema = require('./emails.mongo')
const nodemailer = require('nodemailer')

// !end
// !code: init
const transport = {
  // service: 'Mailjet', // no need to set host or port etc.
  host: process.env.MAILER_HOST, // mailjet
  port: parseInt(process.env.MAILER_PORT),
  secure: process.env.MAILER_SECURE === '1',
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS
  }
}
if (transport.auth.user === '' && transport.auth.pass === '') {
  delete transport.auth
}
const defaults = {
  from: process.env.MAILER_FROM
}
const transporter = nodemailer.createTransport(transport, defaults)
// !end

const moduleExports = async function (app) {
  const db = await app.get('mongoClient')
  const Model = await db.collection('emails', {
    // !<DEFAULT> code: create_collection
    // validator: { $jsonSchema: $jsonSchema },
    // validationLevel: 'strict', // The MongoDB default
    // validationAction: 'error', // The MongoDB default
    // !end
  })
  const paginate = app.get('paginate')
  // !<DEFAULT> code: func_init
  const options = {
    Model,
    paginate,
    whitelist: ['$client'],
    multi: false,
    transporter
  }
  // !end

  // Initialize our service with any options it requires
  // !<DEFAULT> code: extend
  app.use('/emails', createService(options))
  // !end

  // Get our initialized service so that we can register hooks
  const service = app.service('emails')

  service.hooks(hooks)
  // !code: func_return // !end
}
// !code: more // !end

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
