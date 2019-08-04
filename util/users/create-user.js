require('dotenv').config({ path: '../../.env' })
const io = require('socket.io-client')
const feathers = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const logger = require('../../src/logger')
const WebCrypto = require('node-webcrypto-ossl')
const webcrypto = new WebCrypto({
  directory: 'key_storage'
})
// parse arguments
const argv = require('minimist')(process.argv.slice(2), {
  default: {
    apiOrigin: process.env.API_ORIGIN,
    apiPathname: process.env.API_PATHNAME || '',
    service: 'users',
    method: 'create',
    email: 'hotdogee@gmail.com',
    password: 'testtesttest',
    language: 'en', // 'zh-hant'
    country: 'tw'
  }
})
const socket = io(argv.apiOrigin, {
  path: argv.apiPathname + '/socket.io' // default: /socket.io
})
const api = feathers().configure(socketio(socket), { timeout: 1000 })

socket.on('connect', async (connection) => {
  try {
    const key = await dispatch('generateKey')
    const { signature, document } = await sign(key, {
      email: argv.email
    })
    const data = {
      email: argv.email,
      password: argv.password,
      language: argv.language,
      country: argv.country,
      signature,
      document
    }
    const result = await api.service(argv.service)[argv.method](data)
    // { name: 'cam1', _id: '5d405c30cafd4e6cb87a3e92' }
    logger.info(`${argv.service}.${argv.service}`, result)
  } catch (error) {
    logger.error(error)
  } finally {
    process.exit()
  }
})

async function sign (key, payload) {
  const publicKey = await window.crypto.subtle.exportKey(
    'jwk', // can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
    key.publicKey // can be a publicKey or privateKey, as long as extractable was true
  )
  const document = {
    payload,
    publicKey: JSON.stringify(publicKey),
    timestamp: new Date(),
    // timestamp: new Date('2018-11-06T07:34:20.671Z'),
    userAgent: navigator.userAgent
  }
  logger.log(`document = ${document}`)
  const enc = new TextEncoder()
  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' } // can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
    },
    key.privateKey, // from generateKey or importKey above
    enc.encode(JSON.stringify(document)) // ArrayBuffer of data you want to sign
  )
  logger.log(
    `signature(${signature.byteLength}) = ${new Uint8Array(signature)}`
  )
  return { signature, document }
}
