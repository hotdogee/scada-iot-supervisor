/* eslint quotes: 0 */
// Validation definitions for validateSchema hook for service `apiKeys`. (Can be re-generated.)
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
    title: 'ApiKeys',
    description: 'ApiKeys database.',
    required: [],
    uniqueItemProperties: [],
    properties: {}
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
