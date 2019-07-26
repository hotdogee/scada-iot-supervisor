// Configure the Feathers services. (Can be re-generated.)
const images = require('./images/images.service')
const users = require('./users/users.service')

// !code: imports // !end
// !code: init // !end

// eslint-disable-next-line no-unused-vars
const moduleExports = function (app) {
  app.configure(images)
  app.configure(users)
  // !code: func_return // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
