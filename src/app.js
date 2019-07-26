// Configure Feathers app. (Can be re-generated.)
// !code: preface // !end
const path = require('path')
const compress = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./logger')

// !<DEFAULT> code: favicon_import
const favicon = require('serve-favicon')
// !end

const feathers = require('@feathersjs/feathers')
const configuration = require('@feathersjs/configuration')
const express = require('@feathersjs/express')
const socketio = require('@feathersjs/socketio')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./app.hooks')
const channels = require('./channels')
const generatorSpecs = require('../feathers-gen-specs.json')
const authentication = require('./authentication')

const mongodb = require('./mongodb')
// !code: imports
const feathersLogger = require('feathers-logger')
const i18n = require('./i18n')
// !end
// !code: init // !end

const app = express(feathers())
// !code: use_start // !end

// Load app configuration
app.configure(configuration())
// !<DEFAULT> code: init_config
app.set('generatorSpecs', generatorSpecs)
// !end

// Enable security, CORS, compression, favicon and body parsing
// !<DEFAULT> code: helmet_config
app.use(helmet())
// !end
// !<DEFAULT> code: cors_config
app.use(cors())
// !end
// !<DEFAULT> code: compress_config
app.use(compress())
// !end
// !<DEFAULT> code: json_config
app.use(express.json())
// !end
// !<DEFAULT> code: urlencoded_config
app.use(express.urlencoded({ extended: true }))
// !end
// !<DEFAULT> code: use_favicon
// Use favicon
app.use(favicon(path.join(app.get('public'), 'favicon.ico')))
// !end
// !<DEFAULT> code: use_static
// Host the public folder
app.use('/', express.static(app.get('public')))
// !end
// !code: use_end // !end

// Set up Plugins and providers
// !code: config_start
app.configure(feathersLogger(logger))
app.configure(i18n)
// !end
// !<DEFAULT> code: express_rest
app.configure(express.rest())
// !end
// !<DEFAULT> code: express_socketio
app.configure(socketio())
// !end
// Configure database adapters
app.configure(mongodb)

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware)
// Configure authentication (see `authentication.js`)
app.configure(authentication)
// Set up our services (see `services/index.js`)
app.configure(services)
// Set up event channels (see channels.js)
app.configure(channels)
// !code: config_middle // !end

// Configure a middleware for 404s and the error handler
app.use(express.notFound())
app.use(express.errorHandler({ logger }))
// !code: config_end // !end

app.hooks(appHooks)

const moduleExports = app
// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
