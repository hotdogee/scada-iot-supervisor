// Hooks for service `blob`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
// eslint-disable-next-line no-unused-vars
const { authenticate } = require('@feathersjs/authentication').hooks
// !code: imports
const dauria = require('dauria')
// !end

// !<DEFAULT> code: used
// eslint-disable-next-line no-unused-vars
const { iff } = commonHooks
/* eslint-disable no-unused-vars */
const {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch
} = require('./blob.validate')
/* eslint-enables no-unused-vars */
// !end

// !code: init // !end

const moduleExports = {
  before: {
    // Your hooks should include:
    //   all   : authenticate('jwt')
    // !code: before
    all: [
      // authenticate('jwt')
    ],
    find: [],
    get: [],
    create: [fileToUri],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  after: {
    // !code: after
    all: [],
    find: [],
    get: [],
    create: [
      removeUri
    ],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  error: {
    // !code: error
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
    // !<DEFAULT> code: moduleExports
  }
  // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs
function fileToUri (context) {
  if (!context.data.uri && context.params.file) {
    // console.log(context.data)
    const file = context.params.file
    const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
    context.data.uri = uri
  }
}

function removeUri (context) {
  if (context.result && context.result.uri) {
    delete context.result.uri
  }
}
// !end
// !code: end // !end
