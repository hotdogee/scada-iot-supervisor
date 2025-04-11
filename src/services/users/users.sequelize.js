/* eslint quotes: 0 */
// Defines Sequelize model for service `users`. (Can be re-generated.)
const merge = require('lodash.merge')
const Sequelize = require('sequelize')

const DataTypes = Sequelize.DataTypes
// !code: imports // !end
// !code: init // !end

// Your model may need the following fields:
//   email:      { type: DataTypes.STRING, allowNull: false, unique: true },
//   password:   { type: DataTypes.STRING, allowNull: false },
//   googleId:   { type: DataTypes.STRING },
//   facebookId: { type: DataTypes.STRING },
//   twitterId:  { type: DataTypes.STRING },
//   lineId:     { type: DataTypes.STRING },
const moduleExports = merge(
  {},
  // !<DEFAULT> code: sequelize_model
  {
    accounts: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    password: {
      type: DataTypes.TEXT
    },
    tfa: {
      type: DataTypes.TEXT
    },
    authorizations: {
      type: DataTypes.JSONB
    },
    language: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    country: {
      type: DataTypes.TEXT
    },
    avatar: {
      type: DataTypes.INTEGER
    },
    fullName: {
      type: DataTypes.STRING
    },
    displayName: {
      type: DataTypes.STRING
    },
    birthday: {
      type: DataTypes.DATE
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: Date.now
    },
    updated: {
      type: DataTypes.DATE,
      defaultValue: Date.now
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
