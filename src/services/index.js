// Configure the Feathers services. (Can be re-generated.)
const albums = require('./albums/albums.service')
const apiKeys = require('./api-keys/api-keys.service')
const apiServers = require('./api-servers/api-servers.service')
const blob = require('./blob/blob.service')
const emails = require('./emails/emails.service')
const images = require('./images/images.service')
const logs = require('./logs/logs.service')
const notifications = require('./notifications/notifications.service')
const orgs = require('./orgs/orgs.service')
const publicKeys = require('./public-keys/public-keys.service')
const roles = require('./roles/roles.service')
const schedules = require('./schedules/schedules.service')
const subscriptions = require('./subscriptions/subscriptions.service')
const templates = require('./templates/templates.service')
const users = require('./users/users.service')

// !code: imports // !end
// !code: init // !end

// eslint-disable-next-line no-unused-vars
const moduleExports = function (app) {
  app.set(
    'serviceSetup',
    Promise.all([
      albums.call(app, app),
      apiKeys.call(app, app),
      apiServers.call(app, app),
      blob.call(app, app),
      emails.call(app, app),
      images.call(app, app),
      logs.call(app, app),
      notifications.call(app, app),
      orgs.call(app, app),
      publicKeys.call(app, app),
      roles.call(app, app),
      schedules.call(app, app),
      subscriptions.call(app, app),
      templates.call(app, app),
      users.call(app, app)
    ])
  )
  // !code: func_return // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
