const { checkContext } = require('feathers-hooks-common')

exports.timestamp = function (fieldName) {
  return (context) => {
    checkContext(context, 'before', ['create', 'update', 'patch'], 'timestamp')
    context.data[fieldName] = new Date()
    return context
  }
}

exports.assertDate = function (fieldName) {
  return (context) => {
    checkContext(context, 'before', ['create', 'update', 'patch'], 'assertDate')
    if (context.data[fieldName]) {
      context.data[fieldName] = new Date(context.data[fieldName])
    }
    return context
  }
}

exports.assertDateDefault = function (fieldName) {
  return (context) => {
    checkContext(context, 'before', ['create', 'update', 'patch'], 'assertDate')
    if (context.data[fieldName]) {
      context.data[fieldName] = new Date(context.data[fieldName])
    } else {
      context.data[fieldName] = new Date()
    }
    return context
  }
}
