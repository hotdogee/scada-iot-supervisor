require('dotenv').config()

module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || '8681',
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
    secret:
      'e889da34fa082aac28663a15c32d634fdee607145490cab32e8a6e7343bbc78845f94d1ce451dbaba4ab20b07fdee28392c34bbe68c6ba4b3030d2c6c4cfa26102be1d6cd91a142c16c9b07fffead08ba04b60a3afa058e694b524c7dece4b4559958b716ba8b9abc24593fa57a767a1cbb8936ae7613544995b17741135c5f75cec4db9005fe295badcbc728579a6ab6a9595365804926396d3ebe520ff7c1cd7512a153efbedfb7b07ac319da11c67e4e6d05017cf6ba0b04bd2bd4ec917d87113a802c3aa8dc4575acde42bdffad357178c388d62886dc01ce8e5bc8e0d0ed04c57da6a6ce52aa82cf0d396de0f29268dcf83e46acbbb2107bda65d8748b8',
    authStrategies: ['jwt', 'ecdsa', 'local'],
    path: '/authentication',
    jwtOptions: {
      header: {
        typ: 'access'
      },
      issuer: 'infans.io',
      algorithm: 'HS256',
      expiresIn: '30m'
    },
    local: {
      usernameField: 'accounts.value',
      passwordField: '\\password'
    },
    oauth: {
      redirect: 'http://localhost:8685',
      defaults: {
        path: '/oauth',
        host: 'localhost:6001',
        protocol: 'http'
      },
      google: {
        key:
          '830396712455-2pajms642mvqiao4j501nsb4s6bs3stt.apps.googleusercontent.com',
        secret: 'XmDkQmFzC2GPFXtVuk9UFlWk',
        scope: ['profile openid email'],
        nonce: true,
        custom_params: {
          access_type: 'offline'
        },
        profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo'
      },
      facebook: {
        key: '1365216103654575',
        secret: '2a7408f5e6648ed9f09c7594d401f43d',
        scope: ['public_profile', 'email'],
        profileUrl:
          'https://graph.facebook.com/me?fields=id,email,first_name,last_name,short_name,name,middle_name,name_format,picture,permissions'
      },
      line: {
        authorize_url: 'https://access.line.me/oauth2/v2.1/authorize',
        access_url: 'https://api.line.me/oauth2/v2.1/token',
        oauth: 2,
        state: true,
        scope_delimiter: ' ',
        key: '1593954833',
        secret: '89ce4ff0d2c15110ffbca1689113a545',
        scope: ['profile openid email'],
        nonce: true,
        profileUrl: 'https://api.line.me/v2/profile'
      },
      twitter: {
        key: 'dCGPMs0y2Sbt8PlET5t1ToGJ6',
        secret: 'HHidwVt8cdlZjLMJKh2ml6XlgUzfV3ADASYx1pyX3qACtSp6LQ',
        profileUrl:
          'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true&skip_status=true&include_entities=false'
      }
    },
    cookie: {
      enabled: true,
      name: 'feathers-jwt',
      httpOnly: false,
      secure: false
    },
    strategies: ['jwt', 'local'],
    jwt: {
      header: {
        typ: 'access'
      },
      audience: 'api',
      subject: 'access',
      issuer: 'feathers',
      algorithm: 'HS256',
      expiresIn: '30m'
    },
    google: {
      clientID: 'your google client id',
      clientSecret: 'your google client secret',
      successRedirect: '/',
      scope: ['profile openid email']
    },
    facebook: {
      clientID: 'your facebook client id',
      clientSecret: 'your facebook client secret',
      successRedirect: '/',
      scope: ['public_profile', 'email'],
      profileFields: [
        'id',
        'displayName',
        'first_name',
        'last_name',
        'email',
        'gender',
        'profileUrl',
        'birthday',
        'picture',
        'permissions'
      ]
    }
  },
  vapid: {
    subject: 'VAPID_SUBJECT',
    private: 'VAPID_PRIVATE',
    public: 'VAPID_PUBLIC'
  },
  mongodb: 'mongodb://localhost:27017/scada-iot'
}
