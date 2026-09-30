const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/', 'coverage/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      // Express identifies error middleware by its 4 arguments, so `next` must stay.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: { globals: globals.jest },
  },
  prettier,
];
