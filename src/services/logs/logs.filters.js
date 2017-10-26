
// const winston = require('winston')
// var logger = new (winston.Logger)({
//     transports: [
//       new (winston.transports.Console)({
//         // setup console logging with timestamps
//         level: 'debug',
//         timestamp: function() {
//           return (new Date()).toISOString();
//         },
//         formatter: function(options) {
//           return options.timestamp() + ' ' + options.level[0].toUpperCase() + ' ' + (options.message ? options.message : '') +
//             (options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta, null, 2) : '' );
//         }
//       })
//     ]
// });

module.exports = function (data, connection, hook) { // eslint-disable-line no-unused-vars
  if (hook.method !== 'create') return false
  return data;
};

// data = { name: 'Home',
//   logTime: '2017-08-07T19:37:57.131Z',
//   reads:
//    [ { name: '螢幕後', addr: 1, reads: [Array] },
//      { name: '市電', addr: 2, reads: [Array] },
//      { name: '市電', addr: 64, reads: [Array] } ],
//   _id: 5988c1956feb92a130e5ea39 }
// connection = { provider: 'socketio',
//   payload: { userId: '5988abd166403ca330a74d12' },
//   user:
//    { _id: 5988abd166403ca330a74d12,
//      email: 'hotdogee@gmail.com',
//      password: '$2a$10$XoUmQFudNjr/8jeMK.tNRutHnWRLgZUQER3vUupBCcfyuW2bBhPRi' },
//   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1OTg4YWJkMTY2NDAzY2EzMzBhNzRkMTIiLCJpYXQiOjE1MDIxMzQ2NzMsImV4cCI6MTU4ODQ0ODI3MywiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIn0.VCPebQ0ZY3gkff_wUeP55z5aRb4cCX2SRGPqlcJ40KE',
//   headers: { Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1OTg4YWJkMTY2NDAzY2EzMzBhNzRkMTIiLCJpYXQiOjE1MDIxMzQ2NzMsImV4cCI6MTU4ODQ0ODI3MywiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIn0.VCPebQ0ZY3gkff_wUeP55z5aRb4cCX2SRGPqlcJ40KE' },
//   authenticated: true }

// hook = {
//   "data": {
//     "name": "Home",
//     "logTime": "2017-08-07T19:37:57.131Z",
//     "reads": [
//       {
//         "name": "螢幕後",
//         "addr": 1,
//         "reads": [
//           {
//             "name": "壓力",
//             "unit": "bar",
//             "value": 1.0106672048568726,
//             "time": "2017-08-07T19:37:56.652Z"
//           },
//           {
//             "name": "溫度",
//             "unit": "°C",
//             "value": 28.785564422607422,
//             "time": "2017-08-07T19:37:56.652Z"
//           }
//         ]
//       },
//       {
//         "name": "市電",
//         "addr": 2,
//         "reads": [
//           {
//             "name": "功率",
//             "unit": "kW",
//             "value": 0.2271270751953125,
//             "time": "2017-08-07T19:37:56.732Z"
//           },
//           {
//             "name": "功因",
//             "unit": "",
//             "value": 0.957427978515625,
//             "time": "2017-08-07T19:37:56.812Z"
//           },
//           {
//             "name": "用電量",
//             "unit": "kWh",
//             "value": 582.640625,
//             "time": "2017-08-07T19:37:56.892Z"
//           },
//           {
//             "name": "電壓",
//             "unit": "V",
//             "value": 914.4375,
//             "time": "2017-08-07T19:37:56.972Z"
//           },
//           {
//             "name": "電流",
//             "unit": "A",
//             "value": 2.0416259765625,
//             "time": "2017-08-07T19:37:57.052Z"
//           }
//         ]
//       },
//       {
//         "name": "市電",
//         "addr": 64,
//         "reads": [
//           {
//             "name": "頻率",
//             "unit": "Hz",
//             "value": 59.9,
//             "time": "2017-08-07T19:37:57.131Z"
//           }
//         ]
//       }
//     ]
//   },
//   "params": {
//     "query": {},
//     "provider": "socketio",
//     "payload": {
//       "userId": "5988abd166403ca330a74d12"
//     },
//     "user": {
//       "_id": {
//         "_bsontype": "ObjectID",
//         "id": {
//           "0": 89,
//           "1": 136,
//           "2": 171,
//           "3": 209,
//           "4": 102,
//           "5": 64,
//           "6": 60,
//           "7": 163,
//           "8": 48,
//           "9": 167,
//           "10": 77,
//           "11": 18
//         }
//       },
//       "email": "hotdogee@gmail.com",
//       "password": "$2a$10$XoUmQFudNjr/8jeMK.tNRutHnWRLgZUQER3vUupBCcfyuW2bBhPRi"
//     },
//     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1OTg4YWJkMTY2NDAzY2EzMzBhNzRkMTIiLCJpYXQiOjE1MDIxMzQ2NzMsImV4cCI6MTU4ODQ0ODI3MywiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIn0.VCPebQ0ZY3gkff_wUeP55z5aRb4cCX2SRGPqlcJ40KE",
//     "headers": {
//       "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyIsInR5cGUiOiJhY2Nlc3MifQ.eyJ1c2VySWQiOiI1OTg4YWJkMTY2NDAzY2EzMzBhNzRkMTIiLCJpYXQiOjE1MDIxMzQ2NzMsImV4cCI6MTU4ODQ0ODI3MywiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiYW5vbnltb3VzIn0.VCPebQ0ZY3gkff_wUeP55z5aRb4cCX2SRGPqlcJ40KE"
//     },
//     "authenticated": true
//   },
//   "method": "create",
//   "type": "after"
// }
