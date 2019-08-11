// Hooks for service `emails`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')
// !<DEFAULT> code: auth_imports
/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks
/* eslint-enables no-unused-vars */
// !end
// !code: imports
const pug = require('pug')
const request = require('request')
const path = require('path')
const debug = require('debug')(
  `scada:${path.basename(__filename, path.extname(__filename))}`
)
const { timestamp, assertDateOrSetNow } = require('../../hooks/common')
// !end

// !<DEFAULT> code: used
/* eslint-disable no-unused-vars */
const {
  FeathersError,
  BadRequest,
  NotAuthenticated,
  PaymentError,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  NotAcceptable,
  Timeout,
  Conflict,
  LengthRequired,
  Unprocessable,
  TooManyRequests,
  GeneralError,
  NotImplemented,
  BadGateway,
  Unavailable
} = require('@feathersjs/errors')
const {
  iff,
  mongoKeys,
  keep,
  discard,
  disallow,
  isProvider,
  populate,
  alterItems,
  checkContext,
  paramsFromClient,
  paramsForServer
} = commonHooks
const {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch
} = require('./emails.validate')
/* eslint-enables no-unused-vars */
// !end
// !<DEFAULT> code: foreign_keys
// eslint-disable-next-line no-unused-vars
const foreignKeys = []
// !end
// !code: init // !end

const moduleExports = {
  before: {
    // Your hooks should include:
    //   all   : authenticate('jwt')
    //   find  : mongoKeys(ObjectID, foreignKeys)
    // !code: before
    all: [],
    find: [mongoKeys(ObjectID, foreignKeys)],
    get: [],
    create: [sendEmail(), timestamp('created'), timestamp('updated')],
    update: [timestamp('updated')],
    patch: [timestamp('updated')],
    remove: []
    // !end
  },

  after: {
    // !<DEFAULT> code: after
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
  },

  error: {
    // !<DEFAULT> code: error
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
    // !end
    // !<DEFAULT> code: moduleExports
  }
  // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs

function sendEmail () {
  return async (context) => {
    try {
      const { app, data, result, service } = context
      const { options } = service
      const { transporter } = options
      // const data = {
      //   templateName: 'email-verification',
      //   email: value,
      //   language,
      //   token
      // }
      const { templateName: name, email, language, token } = data
      // get template
      const params = {
        query: {
          type: 'email',
          name,
          language
        }
      }
      const {
        total,
        data: [template]
      } = await app.service('templates').find(params)
      // const template = {
      //   type: argv.type,
      //   name: argv.name,
      //   language: 'zh-hant',
      //   content: {
      //     subject: `[蘭陽地熱] 電子郵件驗證信`,
      //     html: {
      //       type: 'pug',
      //       localKeys: ['url', 'complaintEmail'],
      //       content: ''
      //     },
      //     encoding: 'utf-8',
      //     attachments: [
      //       {
      //         // filename: 'logo.gif',
      //         imageId: path.join(__dirname, 'logo-email-256.gif'),
      //         cid: 'logo'
      //       }
      //     ]
      //   }
      // }
      // if we haven't setup templates yet, log token for initial account creation
      if (total === 0) {
        app.error(`${name}.${language} email template not found`)
        app.error(`token = '${token}'`)
        context.result = {
          token
        }
        return context
      }
      const { content } = template
      const { html, attachments } = content
      content.to = email
      // render html
      if (html && html.type === 'pug') {
        content.html = pug.render(html.content, {
          url: `${process.env.UI_URL}/auth/verify-email?token=${token}`,
          complaintEmail: process.env.COMPLAINT_EMAIL,
          logo: 'cid:logo'
        })
      }
      // render images to attachments
      content.attachments = await Promise.all(
        attachments.map(async (a) => {
          if (a.imageId) {
            // generate filename
            const image = await app.service('images').get(a.imageId)
            a.filename = `${a.cid}${path.extname(image.key)}`
            // convert imageId to stream
            await new Promise((resolve, reject) => {
              request.get(
                {
                  uri: `${process.env.API_URL}/images/${a.imageId}?$client[raw]=1`,
                  encoding: null
                },
                (error, response, body) => {
                  if (error) reject(error)
                  a.content = body
                  resolve()
                }
              )
            })
            delete a.imageId
          }
          return a
        })
      )
      // send mail with defined transport object
      app.debug('transporter.sendMail:', content)
      const info = await transporter.sendMail(content)
      data.info = info

      app.debug('Message sent:', info)

      // const i18n = context.app.get('i18n')
      // // debug(i18n.getLocale())
      // const locale = context.data.locale
      // const lang = Object.prototype.hasOwnProperty.call(localeToLang, locale)
      //   ? localeToLang[locale]
      //   : locale
      // debug(lang)
      // i18n.setLocale(lang)
      // //       const data = JSON.parse(
      // //         i18n.__(
      // //           safeStringify({
      // //             to: `{{email}}`,
      // //             subject: `[{{site}}] Email verification`,
      // //             html: `Someone, perhaps you, has added this email address ({{email}}) to their {{site}} account.
      // // If you wish to proceed with this request, <a href="{{verifyUrl}}">click this link to verify your email address</a>: {{verifyUrl}}
      // // This link will expire in 30 minutes.
      // // If you did not make this request, you can safely ignore this email.`
      // //           }),
      // //           {
      // //             email: context.data.email,
      // //             site: `SCADA/IoT - ${i18n.getLocale()} - ${locale}`,
      // //             verifyUrl: `${process.env.UI_URL}/user/verify-email?token=${verifyToken}`
      // //           }
      // //         )
      // //       )
      // const locals = {
      //   email: context.data.email,
      //   site: `SCADA/IoT`,
      //   verifyUrl: `${process.env.UI_URL}/auth/verify-email-app?token=${verifyToken}`,
      //   // verifyUrl: `${
      //   //   process.env.UI_URL
      //   // }/user/verify-email?token=${verifyToken}`,
      //   complaintEmail: 'scada@hanl.in',
      //   logo: 'cid:logo'
      // }
      // const data = {
      //   to: context.data.email,
      //   subject: i18n.__(`[{{site}}] Email verification`, {
      //     site: `SCADA/IoT`
      //   }),
      //   html: verifyEmailTemplate(locals),
      //   encoding: 'utf-8',
      //   attachments: [
      //     {
      //       filename: 'logo.png',
      //       path: path.join(__dirname, 'templates', 'logo-256.png'),
      //       cid: 'logo'
      //     }
      //   ]
      // }
      // debug(data)
      // await context.app.service('emails').create(data)
      return context
    } catch (error) {
      debug(error)
      throw error
    }
  }
}
// !end
// !code: end // !end
