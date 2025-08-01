module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
  },
  overrides: [
    {
      files: ['src/adapters/base-adapter.ts'],
      rules: {
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['src/core/mcp-server.ts'],
      rules: {
        'no-unused-vars': 'off',
        'no-case-declarations': 'off'
      }
    }
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
}; 