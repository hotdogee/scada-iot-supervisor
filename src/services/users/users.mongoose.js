/* eslint quotes: 0 */
// Defines Mongoose model for service `users`. (Can be re-generated.)
const merge = require('lodash.merge')
// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose')
// !code: imports // !end
// !code: init // !end

const moduleExports = merge(
  {},
  // !<DEFAULT> code: model
  {
    accountSelected: Number,
    accounts: [
      {
        type: {
          type: String,
          enum: ['email', 'mobile', 'nationalId', 'passportId'],
          required: true
        },
        value: {
          type: String,
          required: true
        },
        verificationId: mongoose.Schema.Types.ObjectId
      }
    ],
    password: {
      type: String,
      minLength: 8,
      required: true
    },
    tfa: String,
    authorizationSelected: Number,
    authorizations: [
      {
        role: {
          type: String,
          required: true
        },
        org: {
          type: String,
          required: true
        },
        patientId: Number
      }
    ],
    locale: {
      type: String,
      required: true
    },
    avatar: mongoose.Schema.Types.ObjectId,
    fullName: {
      type: String,
      minLength: 2,
      maxLength: 15
    },
    displayName: {
      type: String,
      minLength: 2,
      maxLength: 30
    },
    birthday: Date,
    created: {
      type: Date,
      default: Date.now
    },
    updated: {
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
