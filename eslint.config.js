import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'

const compat = new FlatCompat()

export default [
  ...compat.extends('eslint-config-standard'),
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
      'space-before-function-paren': ['off', 'always'],
      quotes: ['off', 'single', { allowTemplateLiterals: true }]
    }
  }
]
