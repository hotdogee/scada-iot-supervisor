const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const logger = require(path.resolve(__dirname, '../../src/logger'))
const { api, socket } = require('../lib/api')

// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    service: 'albums',
    method: 'patch',
    albumNames: 'cam1,cam2,cam3,cam4'
  }
})

const albumNames = argv.albumNames.split(',')

socket.on('connect', async (connection) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const auth = await api.reAuthenticate()
    const result = await albumNames.reduce(async (p, name) => {
      const acc = await p
      const { total, data } = await api.service(argv.service)['find']({
        query: { name }
      })
      // logger.info(`${argv.service}.find(${name}) = ${total}`, data)
      const { _id } = data[0]
      const result = await api.service(argv.service)[argv.method](_id, {
        keep: 6 * 60 * 24 * 100 // approximately 100 days of photos
      })
      // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
      logger.info(`${argv.service}.${argv.method}(${name})`, result)
      acc.push(result)
      return acc
    }, Promise.resolve([]))
    // logger.info('', result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})
