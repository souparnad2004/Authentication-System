import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/drizzle/migrations/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    plugins: { turbo: turboPlugin },
    rules: {
      // Fails when code reads an env var Turbo does not know about
      'turbo/no-undeclared-env-vars': 'warn',

      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Enforce package public APIs: import the package, never its src
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@repo/*/src', '@repo/*/src/*'],
              message: 'Import from the package entry point, not its src folder.',
            },
          ],
        },
      ],
    },
  },
  // Keep this LAST so it switches off any rule that fights Prettier
  eslintConfigPrettier,
);
