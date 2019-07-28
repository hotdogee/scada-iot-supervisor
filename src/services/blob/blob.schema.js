// Define the Feathers schema for service `blob`. (Can be re-generated.)
// !code: imports // !end
// !code: init // !end

// Define the model using JSON-schema
const schema = {
  // !<DEFAULT> code: schema_header
  title: 'Blob',
  description: 'Blob database.',
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
    _id: { type: 'string' },
    userId: { type: 'ID', faker: { fk: 'users:random' } },
    originalName: { type: 'string' },
    updated: { type: 'string', format: 'date-time', default: Date.now },
    created: { type: 'string', format: 'date-time', default: Date.now }
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
    name: 'Blob',
    service: {
      sort: { _id: 1 }
    },
    // sql: {
    //   sqlTable: 'Blob',
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
