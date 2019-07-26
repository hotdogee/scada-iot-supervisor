var config = require('config')
var MongoClient = require('mongodb').MongoClient
, assert = require('assert')

// Connection URL
var url = config.get('mongodb')

var indexLogsLogTime = function(db, callback) {
  db.collection('logs').createIndex(
    { "logTime": -1 },
    { background: true },
    function(err, results) {
      console.log(results);
      callback();
    }
  );
};

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  indexLogsLogTime(db, function() {
    db.close();
  });
});
