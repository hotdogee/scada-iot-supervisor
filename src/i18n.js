const path = require('path')
const i18n = require('i18n')

module.exports = function (app) {
  i18n.configure({
    // setup some locales - other locales default to en silently
    locales: ['en', 'zh-hant', 'zh-hans'],

    // fall back from Dutch to German
    fallbacks: { 'zh-hant': 'en', 'zh-hans': 'en' },

    // you may alter a site wide default locale
    defaultLocale: 'en',

    // where to store json files - defaults to './locales' relative to modules directory
    directory: path.join('./', 'locales'),

    // watch for changes in json files to reload locale on updates - defaults to false
    autoReload: true,

    // whether to write new locale information to disk - defaults to true
    updateFiles: true,

    // sync locale information across all files - defaults to false
    syncFiles: true,

    // what to use as the indentation unit - defaults to "\t"
    indent: '  ',

    // setting extension of json files - defaults to '.json' (you might want to set this to '.js' according to webtranslateit)
    extension: '.json',

    // object or [obj1, obj2] to bind the i18n api and current locale to - defaults to null
    register: global,

    // enable object notation
    objectNotation: false
  })
  app.use(i18n.init)
  app.set('i18n', i18n)
}
