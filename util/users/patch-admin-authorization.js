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
    service: 'users',
    userId: null,
    org: 'example.com',
    role: 'admin'
  }
})

/* eslint-enables no-unused-vars */
;(async () => {
  try {
    const userId = argv.userId || storage.getItem('user-id')
    if (!userId) throw new Error('userId required')
    const client = await MongoClient.connect(argv.mongodb, {
      useNewUrlParser: true
    })
    const db = client.db()
    const collection = await db.collection('users', {})
    const result = await collection.updateOne(
      { _id: new ObjectID(userId) },
      { $addToSet: { authorizations: { org: argv.org, role: argv.role } } }
    )
    logger.info(`${argv.service}.updateOne`, { result })
    // const result = {
    //   result: { n: 1, nModified: 1, ok: 1 },
    //   connection: { id: 0, host: 'localhost', port: 27017 },
    //   modifiedCount: 1,
    //   upsertedId: null,
    //   upsertedCount: 0,
    //   matchedCount: 1,
    // }
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})()
