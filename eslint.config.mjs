// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...tseslint.configs.recommended,
  eslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'docs/**',
      'docs/upstream/**',
      '../karabiner.ts-upstream/**',
      'karabiner.ts-upstream/**',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'off',
      'no-undef': 'off',
    },
  },
]);
