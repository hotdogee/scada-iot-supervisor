/* eslint quotes: 0 */
// Defines Sequelize model for service `blob`. (Can be re-generated.)
const merge = require('lodash.merge')
const Sequelize = require('sequelize')

const DataTypes = Sequelize.DataTypes
// !code: imports // !end
// !code: init // !end

const moduleExports = merge(
  {},
  // !<DEFAULT> code: sequelize_model
  {
    userId: {
      type: DataTypes.INTEGER
    },
    originalName: {
      type: DataTypes.TEXT
    },
    updated: {
      type: DataTypes.DATE,
      defaultValue: Date.now
    },
    created: {
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
