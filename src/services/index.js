// Configure the Feathers services. (Can be re-generated.)
const albums = require('./albums/albums.service')
const blob = require('./blob/blob.service')
const images = require('./images/images.service')
const logs = require('./logs/logs.service')
const users = require('./users/users.service')

// !code: imports // !end
// !code: init // !end

// eslint-disable-next-line no-unused-vars
const moduleExports = function (app) {
  app.configure(albums)
  app.configure(blob)
  app.configure(images)
  // app.configure(logs)
  app.configure(users)
  app.set('serviceSetup', Promise.all([logs.call(app, app)]))
  // !code: func_return // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
