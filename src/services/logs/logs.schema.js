// Define the Feathers schema for service `logs`. (Can be re-generated.)
// !code: imports // !end
// !code: init // !end

// Define the model using JSON-schema
const schema = {
  // !<DEFAULT> code: schema_header
  title: 'Logs',
  description: 'Logs database.',
  // !end
  // !code: schema_definitions // !end

  // Required fields.
  required: [
    // !code: schema_required // !end
  ],
  // Fields with unique values.
  uniqueItemProperties: [
    // !code: schema_unique // !end
  ],

  // Fields in the model.
  properties: {
    // !code: schema_properties
    logTime: {
      instanceof: 'Date',
      coerce: (data) => new Date(data)
    },
    reads: {
      type: 'array',
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
      }
    }
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
    name: 'Log',
    service: {
      sort: { _id: 1 }
    },
    // sql: {
    //   sqlTable: 'Logs',
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
