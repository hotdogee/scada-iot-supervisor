const jwt = require('jsonwebtoken')
const merge = require('lodash.merge')
const safeStringify = require('fast-safe-stringify')

const { BadRequest } = require('@feathersjs/errors')

exports.verifyToken = function (
  jwtOptions = {},
  error = new BadRequest({
    message: `Invalid verification token`,
    errors: {
      token: `Invalid verification token`
    }
  })
) {
  return async (context) => {
    // try {
    if (!context.data.token) {
      throw error // BadRequest
    }
    // token: eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJ2aWQiOiI1Y2U2YzNlMDA0MjUwZTAwNmU3M2VkMGYiLCJpYXQiOjE1NTg2MjcyOTYsImV4cCI6MTU1ODYyOTA5NiwiYXVkIjoidXNlcnMucGF0Y2giLCJpc3MiOiJpbmZhbnMuaW8iLCJzdWIiOiJ2ZXJpZnkiLCJqdGkiOiJiNTk0MWUyNS05NDg5LTRmMzYtYThlMC05NDU4MTI2YWEzMWUifQ.E4FfXAzII_uFQ17KchRGiL0tNV0jiP7DFvxQH4mX9z0
    // verifyJWT
    const options = merge({}, context.app.get('authentication'), {
      jwt: jwtOptions
    })
    // this doesn't verify subject equals
    const payload = jwt.verify(context.data.token, options.secret, options.jwt)
    // debug(`payload`, payload)
    context.app.info(`verifyToken ${safeStringify(payload)}`, {
      payload
    })
    // {
    //   "vid": "5c8d58b0ff298a003d05a8c9",
    //   "iat": 1552767152,
    //   "exp": 1552768952,
    //   "aud": "users.patch",
    //   "iss": "hanl.in",
    //   "sub": "verify",
    //   "jti": "1214e3d8-686c-42db-a57e-3029d1e6a4b8"
    // }
    // // verify payload
    // if (payload.sub !== 'verify') {
    //   throw error // BadRequest
    // }
    // // retrieve original emailVerification
    // const emailVerification = await context.service.patch(payload.vid, {
    //   completed: new Date()
    // })
    // context.app.info('verifyEmail emailVerification', {
    //   emailVerification: emailVerification,
    //   module: path.basename(__filename, path.extname(__filename))
    // })
    // double check expire time?
    // build patch
    return context
    // } catch (error) {
    //   // debug(error)
    //   throw error
    //   // { TokenExpiredError: jwt expired
    //   // name: 'TokenExpiredError',
    //   // message: 'jwt expired',
    //   // expiredAt: 2019-05-23T16:31:36.000Z }

    //   // { JsonWebTokenError: jwt subject invalid. expected: test
    //   // name: 'JsonWebTokenError',
    //   // message: 'jwt subject invalid. expected: test' }
    // }
  }
}
// // JWT verification test
// const jwt = require('jsonwebtoken')
// const merge = require('lodash.merge')
// var token_old = 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJ2aWQiOiI1Y2U2YzNlMDA0MjUwZTAwNmU3M2VkMGYiLCJpYXQiOjE1NTg2MjcyOTYsImV4cCI6MTU1ODYyOTA5NiwiYXVkIjoidXNlcnMucGF0Y2giLCJpc3MiOiJpbmZhbnMuaW8iLCJzdWIiOiJ2ZXJpZnkiLCJqdGkiOiJiNTk0MWUyNS05NDg5LTRmMzYtYThlMC05NDU4MTI2YWEzMWUifQ.E4FfXAzII_uFQ17KchRGiL0tNV0jiP7DFvxQH4mX9z0'
// var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJ2aWQiOiI1Y2U2Y2MzYzRiMzUyYzAxM2M5NTBhMTYiLCJpYXQiOjE1NTg2Mjk0MzYsImV4cCI6MTU1ODYzMTIzNiwiYXVkIjoidXNlcnMucGF0Y2giLCJpc3MiOiJpbmZhbnMuaW8iLCJzdWIiOiJ2ZXJpZnkiLCJqdGkiOiJmMzkwYTZkOC1jODRjLTQwODktOWQxNi0wN2Y0MmI5OTljYWMifQ.uFyNJ7tQ9hvDcWjTdyBBgTF0_G_XTWk3Kp5UqKiYQHo'
// var secret = '86759c3942d4a3b93031496025c8180ebda7dbbdf5387b1d0f1e9e5cb2bcf67294b1a28951443922c19a0cb018f04b618b0f5ccb7ddd9eb57c5aaaa54e594e2a3decc67bbc1451b77882d190e8a4a572911faa01696f24da5ba52dfabf6f956538554a941906e5f6c7612863deb12851b6d1e6a0767f017511f38da0128a98d61a1c6b3c53393d355cbba022fb11788e6cbf91567415e84d4a032ef1010b15fccfb8ead783c99c2665fa220e72fdbaaf2629ab0b4799d700260f28bd54d9c436ef6dfe88c92074c38aed7bcd0a365c3f011a76002a5bca56732a17af8b3995c8fb80d0bbbdb0bcc60f4dbaf3c581cffd1ea3c29f5bf64803dfe272b5790c8c5b'
// var c = {
//   header: {
//     typ: 'access'
//   },
//   audience: 'api',
//   subject: 'access',
//   issuer: 'hanl.in',
//   algorithm: 'HS256',
//   expiresIn: '30m' // expiresIn: '10s'
// }
// var d = {
//   audience: 'users.patch',
//   subject: 'test'
// }
// var e = merge({}, c, d)
// jwt.verify(token, secret, e, (error, payload) => { console.log(error, payload) })
// d = {
//   audience: 'users.patch',
//   subject: 'verify'
// }
