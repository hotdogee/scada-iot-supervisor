// Define the Feathers schema for service `users`. (Can be re-generated.)
// !code: imports // !end
// !code: init // !end

// Define the model using JSON-schema
const schema = {
  // !<DEFAULT> code: schema_header
  title: 'Users',
  description: 'Users database.',
  // !end
  // !code: schema_definitions
  fakeRecords: 20,
  // !end

  // Required fields.
  required: [
    // !code: schema_required
    'accounts',
    'language'
    // !end
  ],
  // Fields with unique values.
  uniqueItemProperties: [
    // !code: schema_unique // !end
  ],

  // Fields in the model.
  properties: {
    // !code: schema_properties
    _id: { type: 'ID' },
    accounts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'value'],
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['email', 'mobile', 'nationalId', 'passportId']
          },
          value: { type: 'string' }
        }
      }
    },
    password: {
      type: 'string',
      minLength: 8,
      chance: { hash: { length: 60 } }
    },
    tfa: {},
    authorizations: {
      type: 'array',
      maxItems: 100,
      items: {
        type: 'object',
        required: ['role', 'org'],
        properties: {
          org: {
            type: 'string',
            faker: { fk: 'orgs:random' }
          },
          role: {
            type: 'string',
            faker: { fk: 'roles:random' }
          },
          id: {
            // external database id
            type: 'string'
            // faker: { fk: 'orgs:random' }
          }
        }
      }
    },
    language: { type: 'string' },
    country: { type: 'string' },
    avatar: {
      type: 'ID'
      /*, faker: { fk: 'images:random' } */
    },
    fullName: {
      type: 'string',
      minLength: 2,
      maxLength: 15,
      faker: 'name.findName'
    },
    displayName: {
      type: 'string',
      minLength: 2,
      maxLength: 30,
      faker: 'internet.userName'
    },
    birthday: { type: 'string', format: 'date-time', faker: 'date.past' },
    created: { type: 'string', format: 'date-time', default: Date.now },
    updated: { type: 'string', format: 'date-time', default: Date.now }
    // !end
    // !<DEFAULT> code: schema_more
  }
  // !end
}

// Define optional, non-JSON-schema extensions.
const extensions = {
  // GraphQL generation.
  graphql: {
    // !code: graphql_header
    name: 'User',
    service: {
      sort: { _id: 1 }
    },
    // sql: {
    //   sqlTable: 'Users',
    //   uniqueKey: '_id',
    //   sqlColumn: {
    //     __authorId__: '__author_id__',
    //   },
    // },
    // !end
    discard: [
      // !code: graphql_discard // !end
    ],
    add: {
      // !<DEFAULT> code: graphql_add
      // __author__: { type: '__User__!', args: false, relation: { ourTable: '__authorId__', otherTable: '_id' } },
      // !end
      // !<DEFAULT> code: graphql_more
    }
    // !end
  }
}

// !code: more // !end

const moduleExports = {
  // !<DEFAULT> code: moduleExports
  schema,
  extensions
  // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
