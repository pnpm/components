import { renderWindowsReport } from './path-extender'

test('renderWindowsReport()', () => {
  expect(renderWindowsReport([
    {
      action: 'updated',
      variable: 'PNPM_HOME',
      oldValue: 'OLD',
      newValue: 'NEW',
    }
  ])).toStrictEqual({
    oldSettings: 'PNPM_HOME=OLD',
    newSettings: 'PNPM_HOME=NEW',
  })
})
