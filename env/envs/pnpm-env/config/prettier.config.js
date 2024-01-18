const { prettierConfig } = require('@teambit/react.react-env');

module.exports = {
  ...prettierConfig,
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'avoid',
  printWidth: 80,
  tabWidth: 2,
};
