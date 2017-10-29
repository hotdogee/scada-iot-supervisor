require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;

module.exports = function () {
  const app = this;
  const config = process.env.MONGODB || app.get('mongodb');
  const promise = MongoClient.connect(config);

  app.set('mongoClient', promise);
};
