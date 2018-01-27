module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  'parser': 'babel-eslint',
  'parserOptions': {
    'ecmaVersion': 7,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true,
    },
    'sourceType': 'module',
  },
  'plugins': [
    'import',
    'react',
  ],
  'rules': {
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['warn', 2],
    'linebreak-style': ['error', 'unix'],
    'no-console': ['warn', {'allow': ['warn', 'error']}],
    'no-var': 'error',
    'no-unused-vars':
      [ 'error',
        {
          'vars': 'all',
          'varsIgnorePattern': '^_[a-zA-Z].*',
          'args': 'all',
          'argsIgnorePattern': '^_[a-zA-Z].*'
        }
      ],
    'semi': ['error', 'never'],
    'unicode-bom': 'error',
    'react/prop-types': 'off',
    'no-irregular-whitespace': ['error', {'skipStrings': true, 'skipTemplates': true}],
    'import/no-unresolved':
      [2, { 'ignore':
            [
              'redux',
              'views/utils/game-utils',
              'views/utils/selectors',
              'views/create-store',
              'views/components/etc/avatar',
              'views/components/etc/icon',
              'reselect', 'react-*', 'prop-types',
            ] }],
  },
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.es', '.coffee', '.cjsx'],
        'paths': [__dirname],
      },
    },
    'import/core-modules': [
      'bluebird',
      'electron',
      'react',
      'react-redux',
      'redux-observers',
      'reselect',
      'react-bootstrap',
      'react-fontawesome',
      'path-extra',
      'fs-extra',
      'lodash',
      'cson',
    ],
  },
}
