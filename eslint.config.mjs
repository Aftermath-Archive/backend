import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';

export default [
    { 
        files: ['**/*.js'], 
        languageOptions: { 
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest
            }
        }
    },
    pluginJs.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
        plugins: {
            jest: jest
        },
        ...jest.configs['flat/recommended'],
        rules: {
            ...jest.configs['flat/recommended'].rules,
            'jest/prefer-expect-assertions': 'off'
        }
    }
];
