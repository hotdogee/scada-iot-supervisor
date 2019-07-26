/* eslint quotes: 0 */
// Validation definitions for validateSchema hook for service `users`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common')
const merge = require('lodash.merge')
const ajv = require('ajv')
// !code: imports // !end
// !code: init // !end

// !<DEFAULT> code: set_id_type
// eslint-disable-next-line no-unused-vars
const ID = 'string'
// !end

let base = merge(
  {},
  // !<DEFAULT> code: base
  {
    title: 'Users',
    description: 'Users database.',
    required: [],
    uniqueItemProperties: [],
    properties: {}
    // !end
    // !<DEFAULT> code: base_more
  }
  // !end
)
// !code: base_change // !end

let create = merge(
  {},
  // !<DEFAULT> code: create_more
  base
  // !end
)

let update = merge(
  {},
  // !<DEFAULT> code: update_more
  base
  // !end
)

let patch = merge(
  {},
  // !<DEFAULT> code: patch_more
  base
  // !end
)
delete patch.required
// !code: all_change // !end

let validateCreate = options => {
  // !<DEFAULT> code: func_create
  return validateSchema(create, ajv, options)
  // !end
}

let validateUpdate = options => {
  // !<DEFAULT> code: func_update
  return validateSchema(update, ajv, options)
  // !end
}

let validatePatch = options => {
  // !<DEFAULT> code: func_patch
  return validateSchema(patch, ajv, options)
  // !end
}

let quickValidate = (method, data, options) => {
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

let moduleExports = {
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
