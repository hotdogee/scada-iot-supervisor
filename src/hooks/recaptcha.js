const debug = require('debug')('hooks.recaptcha')
const fetch = require('node-fetch')
const { URLSearchParams } = require('url')
const errors = require('@feathersjs/errors')
// const safeStringify = require('fast-safe-stringify')
const { checkContext } = require('feathers-hooks-common')

exports.verifyRecaptcha = function () {
  return async (context) => {
    // check type === before
    checkContext(context, 'before')
    const { params } = context
    const { provider, recaptcha } = params
    // check provider
    if (!provider) {
      debug(`SKIP verifyRecaptcha (server call)`)
      return context
    }

    // debug(`data = ${safeStringify(data)}`)
    // debug(`recaptchaToken = ${data.recaptchaToken}`)
    let result = null
    try {
      debug(`RECAPTCHA_SECRET = ${process.env.RECAPTCHA_SECRET}`)
      const params = new URLSearchParams()
      params.append('secret', process.env.RECAPTCHA_SECRET)
      params.append('response', recaptcha)
      const response = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'post',
          body: params
        }
      )
      // debug(`response = `, response)
      // response =  Response {
      //   size: 0,
      //   timeout: 0,
      //   [Symbol(Body internals)]:
      //    { body:
      //       Gunzip {
      //         _readableState: [ReadableState],
      //         readable: true,
      //         _events: [Object],
      //         _eventsCount: 7,
      //         _maxListeners: undefined,
      //         _writableState: [WritableState],
      //         writable: true,
      //         allowHalfOpen: true,
      //         _transformState: [Object],
      //         bytesWritten: 0,
      //         _handle: [Zlib],
      //         _hadError: false,
      //         _writeState: [Uint32Array],
      //         _outBuffer:
      //          <Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
      // 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >,
      //         _outOffset: 0,
      //         _level: -1,
      //         _strategy: 0,
      //         _chunkSize: 16384,
      //         _defaultFlushFlag: 2,
      //         _finishFlushFlag: 2,
      //         _nextFlush: -1,
      //         _info: undefined },
      //      disturbed: false,
      //      error: null },
      //   [Symbol(Response internals)]:
      //    { url: 'https://www.google.com/recaptcha/api/siteverify',
      //      status: 200,
      //      statusText: 'OK',
      //      headers: Headers { [Symbol(map)]: [Object] } } }
      result = await response.json()
      debug(`result =`, result)
    } catch (error) {
      throw new errors.BadRequest({
        message: 'reCAPTCHA network error',
        errors: [
          {
            name: error.name,
            message: error.message
          }
        ]
      })
    }
    // result =  { success: false,
    //   'error-codes': [ 'missing-input-response', 'missing-input-secret' ] }
    // result =  { success: true,
    //   challenge_ts: '2018-11-19T11:37:45Z',
    //   hostname: 'localhost' }
    // { success: false, 'error-codes': [ 'invalid-input-response' ] }
    // {
    //   "success": true|false,
    //   "challenge_ts": timestamp,  // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
    //   "hostname": string,         // the hostname of the site where the reCAPTCHA was solved
    //   "error-codes": [...]        // optional
    // }

    // Error code Description
    // missing-input-secret The secret parameter is missing.
    // invalid-input-secret The secret parameter is invalid or malformed.
    // missing-input-response The response parameter is missing.
    // invalid-input-response The response parameter is invalid or malformed.
    // bad-request The request is invalid or malformed.
    const ecDesc = {
      'missing-input-secret': 'The secret parameter is missing.',
      'invalid-input-secret': 'The secret parameter is invalid or malformed.',
      'missing-input-response': 'The response parameter is missing.',
      'invalid-input-response':
        'The response parameter is invalid or malformed.',
      'bad-request': 'The request is invalid or malformed.'
    }

    if (!result.success) {
      throw new errors.BadRequest({
        message: 'reCAPTCHA verification failed',
        errors: Array.isArray(result['error-codes'])
          ? result['error-codes'].map((ec) => {
            return {
              name: ec,
              message: ecDesc[ec] ? ecDesc[ec] : ec
            }
          })
          : []
      })
    }

    // request.post({
    //   uri: "https://www.google.com/recaptcha/api/siteverify",
    //   json: true,
    //   form: {
    //     secret: process.env.RECAPTCHA_SECRET,
    //     response: data.recaptchaToken
    //   }
    // }, function (err, response, body) {

    //   //Save the user to the database. At this point they have been verified.
    //   res.status(201).json({message: "Congratulations! We think you are human."});
    // })
    // clean up data
    // delete data[fieldName]
    return context
  }
}
