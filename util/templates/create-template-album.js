// node ./util/templates/create-template-album.js --albumNames=template2

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const logger = require(path.resolve(__dirname, '../../src/logger'))
const { api, socket } = require('../lib/api')

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'albums',
    method: 'create',
    albumNames: 'template'
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
          deduplication: true
        })
        // albums.create = {
        //   name: 'template',
        //   deduplication: true,
        //   created: '2019-08-06T02:49:58.180Z',
        //   updated: '2019-08-06T02:49:58.180Z',
        //   _id: '5d48ead63717e88e0c1207af'
        // }
        logger.info(`${argv.service}.${argv.method}`, result)
      })
    )
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
