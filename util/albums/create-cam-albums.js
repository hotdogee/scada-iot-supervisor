// node ./util/albums/create-cam-albums.js

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const logger = require(path.resolve(__dirname, '../../src/logger'))
const { api, socket } = require('../lib/api')

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'albums',
    method: 'create',
    albumNames: 'cam1,cam2,cam3,cam4'
  }
})
// logger.debug(`argv`, argv)

const albumNames = argv.albumNames.split(',')

socket.on('connect', async (connection) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const auth = await api.reAuthenticate()
    await Promise.all(
      albumNames.map(async (name) => {
        const result = await api.service(argv.service)[argv.method]({
          name: name,
          keep: 10
        })
        // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
        logger.info(`${argv.service}.${argv.method}`, result)
      })
    )
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
