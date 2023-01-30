import fs from 'fs'
import os from 'os'
import path from 'path'
import { PnpmError } from '@pnpm/error'

class BadShellSectionError extends PnpmError {
  public current: string
  public wanted: string
  constructor (opts: { configSectionName: string, wanted: string, current: string, configFile: string }) {
    super('BAD_SHELL_SECTION', `The config file at "${opts.configFile} already contains a ${opts.configSectionName} section but with other configuration`)
    this.current = opts.current
    this.wanted = opts.wanted
  }
}

export type AddingPosition = 'start' | 'end'

export interface AddDirToPosixEnvPathOpts {
  proxyVarName?: string
  overwrite?: boolean
  position?: AddingPosition
  configSectionName: string
}

export type ShellType = 'zsh' | 'bash' | 'fish' | 'ksh'

export type ConfigFileChangeType = 'skipped' | 'appended' | 'modified' | 'created'

export interface ConfigReport {
  path: string
  changeType: ConfigFileChangeType
}

export interface PathExtenderPosixReport {
  configFile: ConfigReport
  oldSettings: string
  newSettings: string
}


export async function addDirToPosixEnvPath (
  dir: string,
  opts: AddDirToPosixEnvPathOpts
): Promise<PathExtenderPosixReport> {
  const currentShell = detectCurrentShell()
  return await updateShell(currentShell, dir, opts)
}

function detectCurrentShell () {
  if (process.env.ZSH_VERSION) return 'zsh'
  if (process.env.BASH_VERSION) return 'bash'
  if (process.env.FISH_VERSION) return 'fish'
  return typeof process.env.SHELL === 'string' ? path.basename(process.env.SHELL) : null
}

async function updateShell (
  currentShell: string | null,
  pnpmHomeDir: string,
  opts: AddDirToPosixEnvPathOpts
): Promise<PathExtenderPosixReport> {
  switch (currentShell) {
  case 'bash':
  case 'zsh':
  case 'ksh': {
    return setupShell(currentShell, pnpmHomeDir, opts)
  }
  case 'fish': {
    return setupFishShell(pnpmHomeDir, opts)
  }
  }
  if (currentShell == null) throw new PnpmError('UNKNOWN_SHELL', 'Could not infer shell type.')
  throw new PnpmError('UNSUPPORTED_SHELL', `Can't setup configuration for "${currentShell}" shell. Supported shell languages are bash, zsh, and fish.`)
}

async function setupShell (shell: 'bash' | 'zsh' | 'ksh', dir: string, opts: AddDirToPosixEnvPathOpts): Promise<PathExtenderPosixReport> {
  const configFile = getConfigFilePath(shell)
  let newSettings!: string
  const _createPathValue = createPathValue.bind(null, opts.position ?? 'start')
  if (opts.proxyVarName) {
    newSettings = `export ${opts.proxyVarName}="${dir}"
export PATH="${_createPathValue(`$${opts.proxyVarName}`)}"`
  } else {
    newSettings = `export PATH="${_createPathValue(dir)}"`
  }
  const content = wrapSettings(opts.configSectionName, newSettings)
  const { changeType, oldSettings } = await updateShellConfig(configFile, content, opts)
  return {
    configFile: {
      path: configFile,
      changeType,
    },
    oldSettings,
    newSettings,
  }
}

function getConfigFilePath (shell: 'bash' | 'zsh' | 'ksh'): string {
  return shell === 'zsh'
    ? path.join((process.env.ZDOTDIR || os.homedir()), `.${shell}rc`)
    : path.join(os.homedir(), `.${shell}rc`)
}

function createPathValue (position: AddingPosition, dir: string) {
  return position === 'start'
    ? `${dir}:$PATH`
    : `$PATH:${dir}`
}

async function setupFishShell (dir: string, opts: AddDirToPosixEnvPathOpts): Promise<PathExtenderPosixReport> {
  const configFile = path.join(os.homedir(), '.config/fish/config.fish')
  let newSettings!: string
  const _createPathValue = createFishPathValue.bind(null, opts.position ?? 'start')
  if (opts.proxyVarName) {
    newSettings = `set -gx ${opts.proxyVarName} "${dir}"
set -gx PATH ${_createPathValue(`$${opts.proxyVarName}`)}`
  } else {
    newSettings = `set -gx PATH ${_createPathValue(dir)}`
  }
  const content = wrapSettings(opts.configSectionName, newSettings)
  const { changeType, oldSettings } = await updateShellConfig(configFile, content, opts)
  return {
    configFile: {
      path: configFile,
      changeType,
    },
    oldSettings,
    newSettings,
  }
}

function wrapSettings (sectionName: string, settings: string): string {
  return `# ${sectionName}
${settings}
# ${sectionName} end`
}

function createFishPathValue (position: AddingPosition, dir: string) {
  return position === 'start'
    ? `"${dir}" $PATH`
    : `$PATH "${dir}"`
}

interface UpdateShellResult {
  changeType: ConfigFileChangeType
  oldSettings: string
}

async function updateShellConfig (
  configFile: string,
  newContent: string,
  opts: AddDirToPosixEnvPathOpts
): Promise<UpdateShellResult> {
  if (!fs.existsSync(configFile)) {
    await fs.promises.mkdir(path.dirname(configFile), { recursive: true })
    await fs.promises.writeFile(configFile, newContent, 'utf8')
    return {
      changeType: 'created',
      oldSettings: '',
    }
  }
  const configContent = await fs.promises.readFile(configFile, 'utf8')
  const match = new RegExp(`# ${opts.configSectionName}\n([\\s\\S]*)\n# ${opts.configSectionName} end`, 'g').exec(configContent)
  if (!match) {
    await fs.promises.appendFile(configFile, `\n${newContent}`, 'utf8')
    return {
      changeType: 'appended',
      oldSettings: '',
    }
  }
  const oldSettings = match[1]
  if (match[0] !== newContent) {
    if (!opts.overwrite) {
      throw new BadShellSectionError({
        configSectionName: opts.configSectionName,
        current: match[0],
        wanted: newContent,
        configFile,
      })
    }
    const newConfigContent = replaceSection(configContent, newContent, opts.configSectionName)
    await fs.promises.writeFile(configFile, newConfigContent, 'utf8')
    return {
      changeType: 'modified',
      oldSettings,
    }
  }
  return {
    changeType: 'skipped',
    oldSettings,
  }
}

function replaceSection (originalContent: string, newSection: string, sectionName: string): string {
  return originalContent.replace(new RegExp(`# ${sectionName}[\\s\\S]*# ${sectionName} end`, 'g'), newSection)
}
