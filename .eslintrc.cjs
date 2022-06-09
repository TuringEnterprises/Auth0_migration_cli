module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 12,
        requireConfigFile: false,
    },

    extends: ['node', 'prettier'],

    rules: {
        'import/no-commonjs': 'off',
    },
};
