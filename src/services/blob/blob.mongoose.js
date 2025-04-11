/* eslint quotes: 0 */
// Defines Mongoose model for service `blob`. (Can be re-generated.)
const merge = require('lodash.merge')

const mongoose = require('mongoose')
// !code: imports // !end
// !code: init // !end

const moduleExports = merge(
  {},
  // !<DEFAULT> code: model
  {
    userId: mongoose.Schema.Types.ObjectId,
    originalName: String,
    updated: {
      type: Date,
      default: Date.now
    },
    created: {
      type: Date,
      default: Date.now
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
