const users = require('./users/users.service.js');
const logs = require('./logs/logs.service.js');
const plcs = require('./plcs/plcs.service.js');
const rtus = require('./rtus/rtus.service.js');
const rtuModels = require('./rtu-models/rtu-models.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(users);
  app.configure(logs);
  app.configure(plcs);
  app.configure(rtus);
  app.configure(rtuModels);
};
