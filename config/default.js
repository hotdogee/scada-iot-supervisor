module.exports = {
  host: 'localhost',
  port: 8081,
  public: '../public/',
  paginate: {
    default: 50,
    max: 1000
  },
  authentication: {
    secret: '8bded4c6c914cac7482dcaab4cb18028988374dafe4e1b57ed81c61a1f806889b4cb72ddc603489992db9b3de77fd2b7d7fb589eb9ab0a9713794f872694a9ff1022d5e420a926269d472173ec05b35514336f3e04b5b52f4a19451d68717e44495cdc90882d05d93b94ca866510969578bd405068810d613d9aaa892a8d44355727fb6ad9b66639d36bee3f4fd637aa108007e502c4dc68f2c63bcd326feb6480e18f520b5d538b55f5dc309ea9db73df5092587181a0ed241ac36ef3dae4d40aa884efd3caff27cc7aa3a17f2bda074f3e794f2cf61e9df89a56348c299dffcd03660e13f5b80d2cc2e516c9a7189ec9ca46e4cb944467d0212d0c39',
    strategies: ['jwt', 'local'],
    path: '/authentication',
    service: 'users',
    jwt: {
      header: {
        type: 'access'
      },
      audience: 'https://yourdomain.com',
      subject: 'anonymous',
      issuer: 'feathers',
      algorithm: 'HS256',
      expiresIn: '999d'
    },
    local: {
      entity: 'user',
      usernameField: 'email',
      passwordField: 'password'
    },
    google: {
      clientID: 'your google client id',
      clientSecret: 'your google client secret',
      successRedirect: '/',
      scope: ['profile openid email']
    },
    cookie: {
      enabled: true,
      name: 'feathers-jwt',
      httpOnly: false,
      secure: false
    }
  },
  mongodb: 'mongodb://localhost:27017/scada-iot',
  supervisor: {
    // "url": "http://localhost:8081"
    url: 'https://scada2.hanl.in',
    options: {
      path: '/api'
    }
  }
}
