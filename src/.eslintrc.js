// eslint-disable-next-line strict
module.exports = {
  env: {
    node: true,
    es6: true,
    mocha: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'strict': ['error', 'global']
  }
};