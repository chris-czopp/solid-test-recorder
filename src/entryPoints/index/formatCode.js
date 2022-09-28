import { parse as parseCode } from '@babel/parser'
import { Linter } from 'ESLinter'
import prettier from 'prettier'
import eslintConfig from 'eslint-config-standard'

const linter = new Linter()

eslintConfig.parserOptions = {
  sourceType: 'module',
  ecmaVersion: eslintConfig.parserOptions.ecmaVersion || 2020,
  ecmaFeatures: {
    jsx: true
  },
  plugins: ['jsx']
}

Object.assign(eslintConfig.rules, {
  'array-bracket-newline': ['error', { multiline: true, minItems: 3 }],
  'array-element-newline': ['error', { multiline: true, minItems: 3 }],
  'array-bracket-spacing': ['error', 'never'],
  'dot-notation': ['error', 'always'],
  'newline-after-var': ['error', 'always'],
  'no-extra-parens': ['error', 'always'],
  'padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: 'import', next: '*' },
    { blankLine: 'never', prev: 'import', next: 'import' },
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: '*', next: 'multiline-expression' },
    { blankLine: 'always', prev: 'multiline-expression', next: '*' }
  ]
})

export default (code) => {
  const { output: lintedCode } = linter.verifyAndFix(code, eslintConfig, { fix: true })

  const formattedCode = prettier.format(lintedCode, {
    parser: (code) => parseCode(code, { sourceType: 'module', plugins: ['jsx'] }),
    semi: false,
    printWidth: 120,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'none'
  })

  return formattedCode
}
