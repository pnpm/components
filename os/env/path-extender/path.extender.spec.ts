import { renderWindowsReport } from './path-extender'

test('renderWindowsReport()', () => {
  expect(renderWindowsReport([
    {
      action: 'updated',
      variable: 'FOO',
      oldValue: undefined,
      newValue: 'NEW_FOO',
    },
    {
      action: 'updated',
      variable: 'PNPM_HOME',
      oldValue: 'OLD',
      newValue: 'NEW',
    },
  ])).toStrictEqual({
    oldSettings: 'PNPM_HOME=OLD',
    newSettings: `FOO=NEW_FOO
PNPM_HOME=NEW`,
  })
})
