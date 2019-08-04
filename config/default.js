require('dotenv').config()

module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || '8081',
  prefixPath: process.env.PREFIX_PATH || '',
  public: '../public/',
  paginate: {
    default: 10,
    max: 50
  },
  tests: {
    environmentsAllowingSeedData: ['test']
  },
  authentication: {
    entity: '\\user',
    service: 'users',
    header: 'Authorization',
    schemes: ['Bearer', 'JWT'],
    secret:
      'e889da34fa082aac28663a15c32d634fdee607145490cab32e8a6e7343bbc78845f94d1ce451dbaba4ab20b07fdee28392c34bbe68c6ba4b3030d2c6c4cfa26102be1d6cd91a142c16c9b07fffead08ba04b60a3afa058e694b524c7dece4b4559958b716ba8b9abc24593fa57a767a1cbb8936ae7613544995b17741135c5f75cec4db9005fe295badcbc728579a6ab6a9595365804926396d3ebe520ff7c1cd7512a153efbedfb7b07ac319da11c67e4e6d05017cf6ba0b04bd2bd4ec917d87113a802c3aa8dc4575acde42bdffad357178c388d62886dc01ce8e5bc8e0d0ed04c57da6a6ce52aa82cf0d396de0f29268dcf83e46acbbb2107bda65d8748b8',
    authStrategies: ['jwt', 'ecdsa', 'local'],
    path: '/authentication',
    jwtOptions: {
      header: {
        typ: 'access'
      },
      issuer: 'hanl.in',
      algorithm: 'HS256',
      expiresIn: '30m'
    },
    local: {
      usernameField: 'accounts.value',
      passwordField: '\\password'
    },
    oauth: {
      redirect: process.env.UI_URL || '/',
      defaults: {
        path: process.env.OAUTH_PATH || '/oauth',
        host:
          process.env.OAUTH_HOST ||
          `${process.env.HOST || 'localhost'}:${process.env.PORT || '6001'}`,
        protocol:
          process.env.OAUTH_PROTOCOL || process.env.NODE_ENV === 'production'
            ? 'https'
            : 'http' // transport: 'session'
      },
      google: {
        key: process.env.GOOGLE_CLIENT_ID || 'your google client id',
        secret: process.env.GOOGLE_CLIENT_SECRET || 'your google client secret',
        scope: ['profile openid email'],
        nonce: true,
        custom_params: {
          access_type: 'offline'
        },
        profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo'
      },
      facebook: {
        key: process.env.FACEBOOK_CLIENT_ID || 'your facebook client id',
        secret:
          process.env.FACEBOOK_CLIENT_SECRET || 'your facebook client secret',
        scope: ['public_profile', 'email'],
        profileUrl:
          'https://graph.facebook.com/me?fields=id,email,first_name,last_name,short_name,name,middle_name,name_format,picture,permissions'
      },
      line: {
        key: process.env.LINE_CLIENT_ID || 'your line client id',
        secret: process.env.LINE_CLIENT_SECRET || 'your line client secret',
        authorize_url: 'https://access.line.me/oauth2/v2.1/authorize',
        access_url: 'https://api.line.me/oauth2/v2.1/token',
        oauth: 2,
        state: true,
        scope_delimiter: ' ',
        scope: ['profile openid email'],
        nonce: true,
        profileUrl: 'https://api.line.me/v2/profile'
      },
      twitter: {
        key: process.env.TWITTER_CLIENT_ID || 'your twitter client id',
        secret:
          process.env.TWITTER_CLIENT_SECRET || 'your twitter client secret',
        profileUrl:
          'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true&skip_status=true&include_entities=false'
      }
    },
    cookie: {
      enabled: true,
      name: 'feathers-jwt',
      httpOnly: false,
      secure: false
    }
  },
  vapid: {
    subject: 'VAPID_SUBJECT',
    private: 'VAPID_PRIVATE',
    public: 'VAPID_PUBLIC'
  },
  mongodb: 'mongodb://localhost:27017/scada-iot'
}
