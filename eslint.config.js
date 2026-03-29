import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ignores: [
      'apps/web/src/hooks/use-persisted-state.ts',
      'apps/web/src/hooks/use-url-state.ts',
      'apps/web/src/components/ui/**',
      'apps/web/src/test/**',
      'apps/web/src/**/*.spec.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useState'],
              message:
                'Preferer usePersistedState pour les etats qui doivent survivre au refresh. useState reste OK pour les etats ephemeres (modals, loading, animations) — ajouter // eslint-disable-line no-restricted-imports.',
            },
          ],
        },
      ],
    },
  },
);
