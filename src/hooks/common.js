// const path = require('path')
// const debug = require('debug')(
//   `infans-api:${path.basename(__filename, path.extname(__filename))}`
// )

exports.timestamp = function (fieldName) {
  return (context) => {
    context.data[fieldName] = new Date()
  }
}
