import { envReplace } from './env-replace';

const ENV = {
  foo: 'foo_value',
  bar: 'bar_value',
}

test.each([
  ['-${foo}-${bar}', '-foo_value-bar_value'],
  ['\\${foo}', '${foo}'],
  ['\\${zoo}', '${zoo}'],
  ['\\\\${foo}', '\\foo_value'],
])('success %s => %s', (settingValue, expected) => {
  const actual = envReplace(settingValue, ENV);
  expect(actual).toEqual(expected);
})

test('fail when the env variable is not found', () => {
  expect(() => envReplace('${baz}', ENV)).toThrow(`Failed to replace env in config: \${baz}`);
})

