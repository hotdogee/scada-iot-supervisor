// mongodb.js - MongoDB adapter
const { parseConnectionString } = require('mongodb-core')
const { MongoClient } = require('mongodb')
const logger = require('./logger')
// !code: imports // !end
// !code: init // !end

module.exports = function (app) {
  const config = app.get('mongodb')
  // !code: func_init // !end

  const dbPromise = MongoClient.connect(config, {
    useNewUrlParser: true
  })
    .then((client) => {
      // For mongodb <= 2.2
      if (client.collection) {
        return client
      }
      const dbName = parseConnectionString(config, () => {})
      return client.db(dbName)
    })
    .catch((error) => {
      console.log(error)
      logger.error(error)
    })

  app.set('mongoClient', dbPromise)
  // !code: more // !end
}
// !code: funcs // !end
// !code: end // !end
