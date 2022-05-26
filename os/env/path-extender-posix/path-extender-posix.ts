import fs from 'fs'
import os from 'os'
import path from 'path'
import PnpmError from '@pnpm/error'

class BadShellSectionError extends PnpmError {
  public current: string
  public wanted: string
  constructor ({ wanted, current, configFile }: { wanted: string, current: string, configFile: string }) {
    super('BAD_SHELL_SECTION', `The config file at "${configFile} already contains a pnpm section but with other configuration`)
    this.current = current
    this.wanted = wanted
  }
}

export type AddingPosition = 'start' | 'end'

export interface AddDirToPosixEnvPathOpts {
  proxyVarName?: string
  overwrite?: boolean
  position?: AddingPosition
  configSectionName: string
}

export async function addDirToPosixEnvPath (
  dir: string,
  opts: AddDirToPosixEnvPathOpts
) {
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
): Promise<string> {
  switch (currentShell) {
  case 'bash':
  case 'zsh': {
    return reportShellChange(await setupShell(currentShell, pnpmHomeDir, opts))
  }
  case 'fish': {
    return reportShellChange(await setupFishShell(pnpmHomeDir, opts))
  }
  }
  return 'Could not infer shell type.'
}

function reportShellChange ({ action, configFile }: ShellSetupResult): string {
  switch (action) {
  case 'created': return `Created ${configFile}`
  case 'added': return `Appended new lines to ${configFile}`
  case 'updated': return `Replaced configuration in ${configFile}`
  case 'skipped': return `Configuration already up-to-date in ${configFile}`
  }
}

type ShellSetupAction = 'created' | 'added' | 'updated' | 'skipped'

interface ShellSetupResult {
  configFile: string
  action: ShellSetupAction
}

async function setupShell (shell: 'bash' | 'zsh', dir: string, opts: AddDirToPosixEnvPathOpts): Promise<ShellSetupResult> {
  const configFile = path.join(os.homedir(), `.${shell}rc`)
  let content!: string
  const _createPathValue = createPathValue.bind(null, opts.position ?? 'start')
  if (opts.proxyVarName) {
    content = `# ${opts.configSectionName}
export ${opts.proxyVarName}="${dir}"
export PATH="${_createPathValue(`$${opts.proxyVarName}`)}"
# ${opts.configSectionName} end`
  } else {
    content = `# ${opts.configSectionName}
export PATH="${_createPathValue(dir)}"
# ${opts.configSectionName} end`
  }
  return {
    action: await updateShellConfig(configFile, content, opts),
    configFile,
  }
}

function createPathValue (position: AddingPosition, dir: string) {
  return position === 'start'
    ? `${dir}:$PATH`
    : `$PATH:${dir}`
}

async function setupFishShell (dir: string, opts: AddDirToPosixEnvPathOpts): Promise<ShellSetupResult> {
  const configFile = path.join(os.homedir(), '.config/fish/config.fish')
  let content!: string
  const _createPathValue = createFishPathValue.bind(null, opts.position ?? 'start')
  if (opts.proxyVarName) {
    content = `# ${opts.configSectionName}
set -gx ${opts.proxyVarName} "${dir}"
set -gx PATH ${_createPathValue(`$${opts.proxyVarName}`)}
# ${opts.configSectionName} end`
  } else {
    content = `# ${opts.configSectionName}
set -gx PATH ${_createPathValue(dir)}
# ${opts.configSectionName} end`
  }
  return {
    action: await updateShellConfig(configFile, content, opts),
    configFile,
  }
}

function createFishPathValue (position: AddingPosition, dir: string) {
  return position === 'start'
    ? `"${dir}" $PATH`
    : `$PATH "${dir}"`
}

async function updateShellConfig (
  configFile: string,
  newContent: string,
  opts: AddDirToPosixEnvPathOpts
): Promise<ShellSetupAction> {
  if (!fs.existsSync(configFile)) {
    await fs.promises.writeFile(configFile, newContent, 'utf8')
    return 'created'
  }
  const configContent = await fs.promises.readFile(configFile, 'utf8')
  const match = configContent.match(new RegExp(`# ${opts.configSectionName}[\\s\\S]*# ${opts.configSectionName} end`, 'g'))
  if (!match) {
    await fs.promises.appendFile(configFile, `\n${newContent}`, 'utf8')
    return 'added'
  }
  if (match[0] !== newContent) {
    if (!opts.overwrite) {
      throw new BadShellSectionError({ current: match[1], wanted: newContent, configFile })
    }
    const newConfigContent = replaceSection(configContent, newContent, opts.configSectionName)
    await fs.promises.writeFile(configFile, newConfigContent, 'utf8')
    return 'updated'
  }
  return 'skipped'
}

function replaceSection (originalContent: string, newSection: string, sectionName: string): string {
  return originalContent.replace(new RegExp(`# ${sectionName}[\\s\\S]*# ${sectionName} end`, 'g'), newSection)
}
