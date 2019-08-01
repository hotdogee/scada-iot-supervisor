/* eslint-disable no-console */
// Start the server. (Can be re-generated.)
// !code: preface // !end
const logger = require('./logger')
const app = require('./app')
const seedData = require('./seed-data')
// !code: imports // !end
// !code: init // !end
;(async () => {
  await app.get('serviceSetup')

  const port = app.get('port')
  const server = app.listen(port)
  // !code: init2 // !end

  process.on('unhandledRejection', (reason, p) => {
    // !<DEFAULT> code: unhandled_rejection_log
    logger.error('Unhandled Rejection at: Promise ', p, reason)
    // !end
    // !code: unhandled_rejection // !end
  })

  server.on('listening', async () => {
    // !code: listening_log
    const env = app.get('env') || process.env.NODE_ENV
    const protocol =
      env === 'development' || env === 'test' || env === undefined
        ? 'http'
        : 'https'
    logger.info(
      `Feathers application started on ${protocol}://${app.get(
        'host'
      )}:${port} NODE_ENV=${env}`
    )
    // !end
    await app.get('mongoClient')
    // !code: listening // !end
    await seedData(app)
    // !code: listening1 // !end
  })
})()

// !code: funcs // !end
// !code: end // !end
