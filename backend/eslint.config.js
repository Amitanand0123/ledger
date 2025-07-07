import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base TypeScript ESLint recommended config
  ...tseslint.configs.recommended,
  
  // Your custom rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Optional: Basic formatting rules
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'es5'],
    },
  }, 
  
  // Parser options
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  }
);