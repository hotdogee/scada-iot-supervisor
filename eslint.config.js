import standardConfig from 'eslint-config-standard'
import globals from 'globals'

export default [
  ...standardConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.mocha,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        btoa: 'readonly',
        atob: 'readonly'
      }
    },
    rules: {
      'quote-props': ['error', 'as-needed'],
      'space-before-function-paren': ['error', 'always']
    }
  }
]
