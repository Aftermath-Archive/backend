import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';

export default [
    { ignores: ['coverage/**', '.husky/_/**'] },
    {
        files: ['**/*.mjs'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
    },
    pluginJs.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['src/tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
        languageOptions: { globals: globals.jest },
        plugins: {
            jest: jest,
        },
        ...jest.configs['flat/recommended'],
        rules: {
            ...jest.configs['flat/recommended'].rules,
            'jest/prefer-expect-assertions': 'off',
        },
    },
];
