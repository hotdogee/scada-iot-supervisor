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
    service: 'templates',
    unique: true,
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
        // src\services\emails\emails.hooks.js sendEmail
        key: { type: 1, name: 1, language: 1 },
        unique: argv.unique,
        background: argv.background
      }
    ])
    logger.info(`${argv.service}.createIndex`, { result })
    // const result = {
    //   result: {
    //     numIndexesBefore: 2,
    //     numIndexesAfter: 2,
    //     note: 'all indexes already exist',
    //     ok: 1
    //   }
    // }
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})()
