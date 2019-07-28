/* eslint quotes: 0 */
// Defines the MongoDB $jsonSchema for service `blob`. (Can be re-generated.)
const merge = require('lodash.merge')
// !code: imports // !end
// !code: init // !end

const moduleExports = merge(
  {},
  // !<DEFAULT> code: model
  {
    bsonType: 'object',
    additionalProperties: false,
    properties: {
      _id: {
        bsonType: 'string'
      },
      userId: {
        faker: {
          fk: 'users:random'
        },
        bsonType: 'objectId'
      },
      originalName: {
        bsonType: 'string'
      },
      updated: {
        format: 'date-time',
        default: Date.now,
        bsonType: 'string'
      },
      created: {
        format: 'date-time',
        default: Date.now,
        bsonType: 'string'
      }
    }
    // !end
    // !<DEFAULT> code: moduleExports
  }
  // !end
)

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
