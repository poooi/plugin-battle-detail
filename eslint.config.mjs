import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],

      // General
      'no-console': 'off',
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },
  {
    ignores: ['node_modules/**', 'index.js'],
  },
)
