/* eslint quotes: 0 */
// Defines the MongoDB $jsonSchema for service `users`. (Can be re-generated.)
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
      accounts: {
        items: {
          type: 'object',
          required: ['type', 'value'],
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              enum: ['email', 'mobile', 'nationalId', 'passportId']
            },
            value: {
              type: 'string'
            }
          }
        },
        bsonType: 'array'
      },
      password: {
        minLength: 8,
        chance: {
          hash: {
            length: 60
          }
        },
        bsonType: 'string'
      },
      tfa: {
        bsonType: 'string'
      },
      authorizations: {
        maxItems: 100,
        items: {
          type: 'object',
          required: ['role', 'org'],
          properties: {
            org: {
              type: 'string',
              faker: {
                fk: 'orgs:random'
              }
            },
            role: {
              type: 'string',
              faker: {
                fk: 'roles:random'
              }
            },
            id: {
              type: 'string'
            }
          }
        },
        bsonType: 'array'
      },
      language: {
        bsonType: 'string'
      },
      country: {
        bsonType: 'string'
      },
      avatar: {
        bsonType: 'objectId'
      },
      fullName: {
        minLength: 2,
        maxLength: 15,
        faker: 'name.findName',
        bsonType: 'string'
      },
      displayName: {
        minLength: 2,
        maxLength: 30,
        faker: 'internet.userName',
        bsonType: 'string'
      },
      birthday: {
        format: 'date-time',
        faker: 'date.past',
        bsonType: 'string'
      },
      created: {
        format: 'date-time',
        default: Date.now,
        bsonType: 'string'
      },
      updated: {
        format: 'date-time',
        default: Date.now,
        bsonType: 'string'
      }
    },
    required: ['accounts', 'language']
    // !end
    // !<DEFAULT> code: moduleExports
  }
  // !end
)

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
