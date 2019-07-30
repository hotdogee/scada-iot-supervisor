/* eslint quotes: 0 */
// Defines the MongoDB $jsonSchema for service `logs`. (Can be re-generated.)
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
        bsonType: 'objectId'
      },
      logTime: {
        instanceof: 'Date',
        coerce: (data) => new Date(data),
        bsonType: 'string'
      },
      reads: {
        items: {
          type: 'object',
          properties: {
            reads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  time: {
                    instanceof: 'Date',
                    coerce: (data) => new Date(data)
                  }
                }
              }
            }
          }
        },
        bsonType: 'array'
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
