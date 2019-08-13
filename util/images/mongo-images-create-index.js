/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const { MongoClient, ObjectID } = require('mongodb')
const logger = require('../../src/logger')
const { storage } = require('../lib/api')
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    mongodb: process.env.MONGODB,
    service: 'images',
    unique: false,
    background: false
  }
})

/* eslint-enables no-unused-vars */
;(async () => {
  try {
    const client = await MongoClient.connect(argv.mongodb, {
      useNewUrlParser: true
    })
    const db = client.db()
    const collection = await db.collection(argv.service, {})
    const result = await collection.createIndexes([
      {
        // src\services\blob\blob.hooks.js removeFromBlobStore
        // src\services\images\images.hooks.js assertAlbumDeduplicate
        key: { key: 1, albumId: 1 }
      },
      {
        // src\services\images\images.hooks.js assertAlbumLimit
        key: { albumId: 1, timestamp: 1 }
      },
      {
        // src\store\images\actions.js setupRealtimeUpdates
        key: { albumId: 1, timestamp: -1 }
      }
    ])
    logger.info(`${argv.service}.createIndex`, { result })
    // const result = {
    //   result: {
    //     createdCollectionAutomatically: false,
    //     numIndexesBefore: 1,
    //     numIndexesAfter: 4,
    //     ok: 1
    //   }
    // }
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})()
