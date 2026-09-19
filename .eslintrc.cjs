/* ESLint v8 配置（.eslintrc.cjs，兼容 "type": "module" 项目） */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser'
    },
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.vue']
      }
    },
    {
      // 六爻引擎文件不在本任务修改范围（由后续阶段维护），
      // 此处仅关闭未使用变量告警，不改动其逻辑。
      files: ['src/engine/liuyao/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/no-v-html': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ]
  }
}
