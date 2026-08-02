// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // A config object whose only key is `ignores` is a *global* ignore. Keeping
  // it separate from the rules block below is what makes that true — when the
  // two were merged, this acted as a per-config filter instead.
  {
    ignores: [
      'node_modules/**',
      'docs/**',
      'karabiner-output.json',
      'backups/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Type information is enabled for the two type-aware rules below only.
    // The full `recommendedTypeChecked` set is not used: its
    // `no-floating-promises` fires on every `test()` call from `node:test`,
    // which is the documented way to write these tests.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Directly enforces the discriminated-union discipline the engine relies
      // on: a new ActionSpec / Condition variant must be handled everywhere it
      // is switched over.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Type-only imports must say so; `verbatimModuleSyntax` is on.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Ratchet: `any` is a warning, and `npm run lint` fails above the current
      // count (see --max-warnings in package.json). Lower the ceiling as the
      // remaining sites are typed; never raise it.
      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Tests deliberately construct malformed inputs to assert the engine
    // rejects them.
    files: ['src/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
