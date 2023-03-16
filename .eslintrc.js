// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  env: {
    es2020: true,
    browser: true,
    jest: true,
  },
  extends: [
    'standard',
  ],
  rules: {
    'no-await-in-loop': 0,
    'no-underscore-dangle': 0,
    'react/jsx-fragments': 0,
    'import/prefer-default-export': 0,
    'import/no-extraneous-dependencies': 1,
    'comma-dangle': 0,
    'no-console': 0,
    'no-mixed-operators': 0,
    'max-len': 0,
  },
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2020
  },
}
