import PnpmError from '@pnpm/error'
import matchAll from 'string.prototype.matchall'
import { win32 as path } from 'path'
import execa from 'safe-execa'

class BadEnvVariableError extends PnpmError {
  public envName: string
  public wantedValue: string
  public currentValue: string
  constructor ({ envName, wantedValue, currentValue }: { envName: string, wantedValue: string, currentValue: string }) {
    super('BAD_ENV_FOUND', `Currently '${envName}' is set to '${wantedValue}'`)
    this.envName = envName
    this.wantedValue = wantedValue
    this.currentValue = currentValue
  }
}

type IEnvironmentValueMatch = { groups: { name: string, type: string, data: string } } & RegExpMatchArray

const REG_KEY = 'HKEY_CURRENT_USER\\Environment'

export type AddingPosition = 'start' | 'end'

export interface AddDirToWindowsEnvPathOpts {
  proxyVarName?: string
  overwriteProxyVar?: boolean
  position?: AddingPosition
}

export interface EnvVariableChange {
  variable: string,
  action: EnvVariableChangeAction
  oldValue: string,
  newValue: string,
}

export type PathExtenderWindowsReport = EnvVariableChange[]

export async function addDirToWindowsEnvPath (dir: string, opts?: AddDirToWindowsEnvPathOpts): Promise<PathExtenderWindowsReport> {
  // Use `chcp` to make `reg` use utf8 encoding for output.
  // Otherwise, the non-ascii characters in the environment variables will become garbled characters.
  const chcpResult = await execa('chcp')
  const cpMatch = /\d+/.exec(chcpResult.stdout) ?? []
  const cpBak = parseInt(cpMatch[0])
  if (chcpResult.failed || !(cpBak > 0)) {
    throw new PnpmError('CHCP', `exec chcp failed: ${cpBak}, ${chcpResult.stderr}`)
  }
  await execa('chcp', ['65001'])
  try {
    return await _addDirToWindowsEnvPath(dir, opts)
  } finally {
    await execa('chcp', [cpBak.toString()])
  }
}

export type EnvVariableChangeAction = 'skipped' | 'updated'

async function _addDirToWindowsEnvPath (dir: string, opts: AddDirToWindowsEnvPathOpts = {}): Promise<PathExtenderWindowsReport> {
  const addedDir = path.normalize(dir)
  const registryOutput = await getRegistryOutput()
  const changes: PathExtenderWindowsReport = []
  if (opts.proxyVarName) {
    changes.push(await updateEnvVariable(registryOutput, opts.proxyVarName, addedDir, { overwrite: opts.overwriteProxyVar }))
    changes.push(await addToPath(registryOutput, `%${opts.proxyVarName}%`, opts.position))
  } else {
    changes.push(await addToPath(registryOutput, addedDir, opts.position))
  }

  return changes
}

async function updateEnvVariable (registryOutput: string, name: string, value: string, opts: { overwrite: boolean }): Promise<EnvVariableChange> {
  const currentValue = await getEnvValueFromRegistry(registryOutput, name)
  if (currentValue && !opts.overwrite) {
    if (currentValue !== value) {
      throw new BadEnvVariableError({ envName: name, currentValue, wantedValue: value })
    }
    return { variable: name, action: 'skipped', oldValue: currentValue, newValue: value }
  } else {
    await setEnvVarInRegistry(name, value)
    return { variable: name, action: 'updated', oldValue: currentValue, newValue: value }
  }
}

async function addToPath (registryOutput: string, addedDir: string, position: AddingPosition = 'start'): Promise<EnvVariableChange> {
  const variable = 'Path'
  const pathData = await getEnvValueFromRegistry(registryOutput, variable)
  if (pathData === undefined || pathData == null || pathData.trim() === '') {
    throw new PnpmError('NO_PATH', '"Path" environment variable is not found in the registry')
  } else if (pathData.split(path.delimiter).includes(addedDir)) {
    return { action: 'skipped', variable, oldValue: pathData, newValue: pathData }
  } else {
    const newPathValue = position === 'start'
      ? `${addedDir}${path.delimiter}${pathData}`
      : `${pathData}${path.delimiter}${addedDir}`
    await setEnvVarInRegistry('Path', newPathValue)
    return { action: 'updated', variable, oldValue: pathData, newValue: newPathValue }
  }
}

// `windowsHide` in `execa` is true by default, which will cause `chcp` to have no effect.
const EXEC_OPTS = { windowsHide: false }

/**
 * We read all the registry values and then pick the keys that we need.
 * This is done because if we would try to pick a key that is not in the registry, the command would fail.
 * And it is hard to identify the real cause of the command failure.
 */
async function getRegistryOutput (): Promise<string> {
  try {
    const queryResult = await execa('reg', ['query', REG_KEY], EXEC_OPTS)
    return queryResult.stdout
  } catch (err: any) { // eslint-disable-line
    throw new PnpmError('REG_READ', 'win32 registry environment values could not be retrieved')
  }
}

async function getEnvValueFromRegistry (registryOutput: string, envVarName: string): Promise<string | undefined> {
  const regexp = new RegExp(`^ {4}(?<name>${envVarName}) {4}(?<type>\\w+) {4}(?<data>.*)$`, 'gim')
  const match = Array.from(matchAll(registryOutput, regexp))[0] as IEnvironmentValueMatch
  return match?.groups.data
}

async function setEnvVarInRegistry (envVarName: string, envVarValue: string) {
  try {
    await execa('reg', ['add', REG_KEY, '/v', envVarName, '/t', 'REG_EXPAND_SZ', '/d', envVarValue, '/f'], EXEC_OPTS)
  } catch (err: any) { // eslint-disable-line
    throw new PnpmError('FAILED_SET_ENV', `Failed to set "${envVarName}" to "${envVarValue}": ${err.stderr as string}`)
  }
  // When setting environment variables through the registry, they will not be recognized immediately.
  // There is a workaround though, to set at least one environment variable with `setx`.
  // We have some redundancy here because we run it for each env var.
  // It would be enough also to run it only for the last changed env var.
  // Read more at: https://bit.ly/39OlQnF
  await execa('setx', [envVarName, envVarValue], EXEC_OPTS)
}

