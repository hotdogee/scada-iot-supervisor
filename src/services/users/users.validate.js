/* eslint quotes: 0 */
// Validation definitions for validateSchema hook for service `users`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common')
const merge = require('lodash.merge')
const Ajv = require('ajv')
// !code: imports // !end
// !<DEFAULT> code: init
const ajv = new Ajv()
require('ajv-keywords/keywords/instanceof')(ajv)
ajv.addKeyword('coerce', {
  type: 'string',
  modifying: true,
  validate: (fn, data, ps, path, parent, key) => {
    parent[key] = fn(data)
    return true
  }
})
// !end

// !<DEFAULT> code: set_id_type
// eslint-disable-next-line no-unused-vars
const ID = 'string'
// !end

const base = merge(
  {},
  // !<DEFAULT> code: base
  {
    title: 'Users',
    description: 'Users database.',
    fakeRecords: 20,
    required: ['accounts', 'password', 'locale'],
    uniqueItemProperties: [],
    properties: {
      _id: {
        type: 'ID'
      },
      accountSelected: {
        type: 'number'
      },
      accounts: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'value'],
          properties: {
            type: {
              type: 'string',
              enum: ['email', 'mobile', 'nationalId', 'passportId']
            },
            value: {
              type: 'string'
            },
            verificationId: {
              type: 'ID'
            }
          }
        }
      },
      password: {
        type: 'string',
        minLength: 8,
        chance: {
          hash: {
            length: 60
          }
        }
      },
      tfa: {
        type: 'string'
      },
      authorizationSelected: {
        type: 'number'
      },
      authorizations: {
        type: 'array',
        maxItems: 100,
        items: {
          type: 'object',
          required: ['role', 'org'],
          properties: {
            role: {
              type: 'string',
              faker: {
                fk: 'roles:random'
              }
            },
            org: {
              type: 'string',
              faker: {
                fk: 'orgs:random'
              }
            },
            patientId: {
              type: 'number'
            }
          }
        }
      },
      locale: {
        type: 'string'
      },
      avatar: {
        type: 'ID'
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
      birthday: {
        type: 'string',
        format: 'date-time',
        faker: 'date.past'
      },
      created: {
        type: 'string',
        format: 'date-time',
        default: Date.now
      },
      updated: {
        type: 'string',
        format: 'date-time',
        default: Date.now
      }
    }
    // !end
    // !<DEFAULT> code: base_more
  }
  // !end
)
// !code: base_change // !end

const create = merge(
  {},
  // !<DEFAULT> code: create_more
  base
  // !end
)

const update = merge(
  {},
  // !<DEFAULT> code: update_more
  base
  // !end
)

const patch = merge(
  {},
  // !<DEFAULT> code: patch_more
  base
  // !end
)
delete patch.required
// !code: all_change // !end

const validateCreate = (options) => {
  // !<DEFAULT> code: func_create
  return validateSchema(create, ajv, options)
  // !end
}

const validateUpdate = (options) => {
  // !<DEFAULT> code: func_update
  return validateSchema(update, ajv, options)
  // !end
}

const validatePatch = (options) => {
  // !<DEFAULT> code: func_patch
  return validateSchema(patch, ajv, options)
  // !end
}

const quickValidate = (method, data, options) => {
  try {
    if (method === 'create') {
      validateCreate(options)({ type: 'before', method: 'create', data })
    }
    if (method === 'update') {
      validateCreate(options)({ type: 'before', method: 'update', data })
    }
    if (method === 'patch') {
      validateCreate(options)({ type: 'before', method: 'patch', data })
    }
  } catch (err) {
    return err
  }
}
// !code: validate_change // !end

const moduleExports = {
  // !<DEFAULT> code: moduleExports
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch,
  quickValidate
  // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
