// node .\util\images\find-images.js

/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { api, socket } = require('../lib/api')
const { paramsForServer } = require('feathers-hooks-common')
const logger = require('../../src/logger')
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiKey: process.env.API_KEY,
    service: 'images',
    method: 'find'
  }
})
// logger.debug(`argv`, argv)

/* eslint-enables no-unused-vars */
socket.on('connect', async (connection) => {
  try {
    if (!argv.apiKey) throw new Error('apiKey required')
    const auth = await api.authenticate({
      strategy: 'jwt',
      accessToken: argv.apiKey
    })
    // logger.info(`authenticate result =`, auth)
    // auth = {
    //   accessToken:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE1NjUzNzgyNjEsImV4cCI6MTg4MDk1NDI2MSwiYXVkIjoiYXBpLWtleSIsImlzcyI6ImhhbmwuaW4iLCJzdWIiOiI1ZDRkODYwYjA5YjlkMTNhZmM2ZDIzZWUifQ.JXRxPXXL366NxyER8_Hnc8ORRDlpKoOh5dRtJZNGWWA',
    //   authentication: {
    //     strategy: 'jwt',
    //     payload: {
    //       iat: 1565378261,
    //       exp: 1880954261,
    //       aud: 'api-key',
    //       iss: 'hanl.in',
    //       sub: '5d4d860b09b9d13afc6d23ee'
    //     }
    //   },
    //   user: {
    //     _id: '5d4d860b09b9d13afc6d23ee',
    //     accounts: [
    //       {
    //         type: 'email',
    //         value: 'hotdogee@gmail.com',
    //         verified: '2019-08-09T14:52:41.732Z'
    //       }
    //     ],
    //     language: 'en',
    //     country: 'tw',
    //     created: '2019-08-09T14:41:15.799Z',
    //     updated: '2019-08-09T14:52:41.737Z',
    //     authorizations: [{ org: 'hanl.in', role: 'admin' }]
    //   }
    // }
    const params = paramsForServer({
      query: {
        $limit: 1,
        $select: ['_id']
      }
    })
    let result = await api.service(argv.service)[argv.method](params)
    logger.info(`${argv.service}.${argv.method} result =`, result, {
      ids: result.data
    })
    result = await api.service(argv.service).remove(result.data[0]._id)
    logger.info(`${argv.service}.remove result =`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})

/* eslint-disable no-unused-vars */
/* eslint-enables no-unused-vars */
