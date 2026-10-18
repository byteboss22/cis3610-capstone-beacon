import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  { files: ['server/**/*.js', 'tests/**/*.js'], extends: [js.configs.recommended], languageOptions: { globals: globals.node } },
  { files: ['src/**/*.{ts,tsx}', 'tests/**/*.tsx'], extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { 'react-hooks': hooks }, rules: hooks.configs.recommended.rules,
    languageOptions: { globals: { ...globals.browser, ...globals.node } } },
);
