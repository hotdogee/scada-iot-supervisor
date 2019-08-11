require('dotenv').config()
const config = require('config')

console.log(process.env.MONGODB || config.get('mongodb'))
