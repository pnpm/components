import execa from 'safe-execa'
import { addDirToWindowsEnvPath } from './path-extender-windows'

jest.mock('safe-execa')

const regKey = 'HKEY_CURRENT_USER\\Environment'
const home = 'C:\\Users\\Test User\\AppData\\Local\\pnpm'
const userPath = '%PNPM_HOME%\\bin;%USERPROFILE%\\WindowsApps'
const opts = { proxyVarName: 'PNPM_HOME', proxyVarSubDir: 'bin' }

function mockRegistry (type: string, value = home) {
  execa['mockReset']()
  execa['mockResolvedValueOnce']({ failed: false, stdout: 'Active code page: 437' })
    .mockResolvedValueOnce({ failed: false, stdout: '' })
    .mockResolvedValueOnce({
      failed: false,
      stdout: `\r\n${regKey}\r\n    PNPM_HOME    ${type}    ${value}\r\n    Path    REG_EXPAND_SZ    ${userPath}\r\n`,
    })
    .mockResolvedValue({ failed: false, stdout: '' })
}

function registryWrites () {
  return execa['mock'].calls.filter(([command, args]: [string, string[]]) => command === 'reg' && args[0] === 'add')
}

test('repairs legacy PNPM_HOME without duplicating Path, then skips a repeat setup', async () => {
  mockRegistry('REG_EXPAND_SZ')
  const report = await addDirToWindowsEnvPath(home, opts)
  expect(report).toStrictEqual([
    { variable: 'PNPM_HOME', action: 'updated', oldValue: home, newValue: home },
    { variable: 'Path', action: 'skipped', oldValue: userPath, newValue: userPath },
  ])
  expect(registryWrites()).toStrictEqual([
    ['reg', ['add', regKey, '/v', 'PNPM_HOME', '/t', 'REG_SZ', '/d', home, '/f'], { windowsHide: false }],
  ])
  expect(execa).toHaveBeenLastCalledWith('chcp', ['437'])

  mockRegistry('REG_SZ')
  const repeatReport = await addDirToWindowsEnvPath(home, opts)
  expect(repeatReport.every(change => change.action === 'skipped')).toBe(true)
  expect(registryWrites()).toStrictEqual([])
})

test.each(['REG_SZ', 'REG_EXPAND_SZ'])('preserves a different PNPM_HOME stored as %s', async (type) => {
  mockRegistry(type, 'C:\\other')
  await expect(addDirToWindowsEnvPath(home, opts)).rejects.toMatchObject({ code: 'ERR_PNPM_BAD_ENV_FOUND' })
  expect(registryWrites()).toStrictEqual([])
  expect(execa).toHaveBeenLastCalledWith('chcp', ['437'])
})

test.each(['REG_SZ', 'REG_EXPAND_SZ'])('force replaces a different PNPM_HOME stored as %s', async (type) => {
  mockRegistry(type, 'C:\\other')
  const report = await addDirToWindowsEnvPath(home, { ...opts, overwriteProxyVar: true })
  expect(report[0]).toStrictEqual({ variable: 'PNPM_HOME', action: 'updated', oldValue: 'C:\\other', newValue: home })
  expect(registryWrites()).toStrictEqual([
    ['reg', ['add', regKey, '/v', 'PNPM_HOME', '/t', 'REG_SZ', '/d', home, '/f'], { windowsHide: false }],
  ])
})

test('propagates a failed type repair and restores the code page', async () => {
  mockRegistry('REG_EXPAND_SZ')
  execa['mockRejectedValueOnce'](Object.assign(new Error('Access denied'), { stderr: 'Access denied' }))
  await expect(addDirToWindowsEnvPath(home, opts)).rejects.toMatchObject({ code: 'ERR_PNPM_FAILED_SET_ENV' })
  expect(registryWrites()).toHaveLength(1)
  expect(execa['mock'].calls.some(([command]: [string]) => command === 'setx')).toBe(false)
  expect(execa).toHaveBeenLastCalledWith('chcp', ['437'])
})
