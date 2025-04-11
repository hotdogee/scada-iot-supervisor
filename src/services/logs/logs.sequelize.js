/* eslint quotes: 0 */
// Defines Sequelize model for service `logs`. (Can be re-generated.)
const merge = require('lodash.merge')
const Sequelize = require('sequelize')

const DataTypes = Sequelize.DataTypes
// !code: imports // !end
// !code: init // !end

const moduleExports = merge(
  {},
  // !<DEFAULT> code: sequelize_model
  {
    logTime: {
      type: DataTypes.TEXT
    },
    reads: {
      type: DataTypes.JSONB
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
