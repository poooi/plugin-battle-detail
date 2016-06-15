module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  'installedESLint': true,
  'parserOptions': {
    'ecmaVersion': 7,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true,
    },
    'sourceType': 'module',
  },
  'plugins': [
    'react',
  ],
  'parser': 'babel-eslint',
  'rules': {
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['warn', 2],
    'linebreak-style': ['error', 'unix'],
    'no-console': ['warn', {'allow': ['warn', 'error']}],
    'no-var': 'error',
    'no-unused-vars': ['error', {'args': 'none'}],
    'semi': ['error', 'never'],
    'sort-vars': 'warn',
    'unicode-bom': 'error',

    'react/prop-types': 'off',
  },
}
