// const path = require('path')
// const debug = require('debug')(
//   `infans-api:${path.basename(__filename, path.extname(__filename))}`
// )

exports.timestamp = function (fieldName) {
  return (context) => {
    context.data[fieldName] = new Date()
    return context
  }
}

exports.assertDate = function (fieldName) {
  return (context) => {
    if (context.data[fieldName]) {
      context.data[fieldName] = new Date(context.data[fieldName])
    }
    return context
  }
}
