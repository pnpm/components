import fs from 'fs'
import path from 'path'

import { homedir } from 'os'
import { tempDir } from '@pnpm/prepare'
import { addDirToPosixEnvPath } from './path-extender-posix'

jest.mock('os', () => {
  const os = jest.requireActual('os')
  return {
    ...os,
    homedir: jest.fn(),
  }
})

let homeDir!: string
let pnpmHomeDir!: string

beforeEach(() => {
  homeDir = tempDir()
  pnpmHomeDir = path.join(homeDir, '.pnpm')
  ;(homedir as jest.Mock).mockReturnValue(homeDir)
})

describe('Bash', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/bash'
  })
  beforeEach(() => {
    configFile = path.join(homeDir, '.bashrc')
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should append to empty shell script without using a proxy variable', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `case ":$PATH:" in
  *":${pnpmHomeDir}:"*) ;;
  *) export PATH="${pnpmHomeDir}:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
case ":$PATH:" in
  *":${pnpmHomeDir}:"*) ;;
  *) export PATH="${pnpmHomeDir}:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should put the new directory to the end of the PATH', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac
# pnpm end
`)
  })
  it('should create a shell script', async () => {
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'created',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'skipped',
      },
      oldSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    await expect(
      addDirToPosixEnvPath(pnpmHomeDir, {
        proxyVarName: 'PNPM_HOME',
        configSectionName: 'pnpm',
      })
    ).rejects.toThrowError(/The config file at/)
  })
  it('should not fail if setup is forced', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'modified',
      },
      oldSettings: `export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
})

describe('Zsh', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/zsh'
    process.env.ZDOTDIR = ''
  })
  beforeEach(() => {
    configFile = path.join(homeDir, '.zshrc')
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: ``,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'skipped',
      },
      oldSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
  it('should target config file in custom directory when ZDOTDIR is present', async () => {
    const customDir = path.join(homeDir, 'customDir')
    process.env.ZDOTDIR = customDir
    fs.mkdirSync(customDir)
    const customConfigFile = path.join(process.env.ZDOTDIR, '.zshrc')
    fs.writeFileSync(configFile, '', 'utf8')
    fs.writeFileSync(customConfigFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: customConfigFile,
        changeType: 'appended',
      },
      oldSettings: ``,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    const customConfigContent = fs.readFileSync(customConfigFile, 'utf8')
    expect(configContent).toEqual(``)
    expect(customConfigContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
    process.env.ZDOTDIR = ''
  })
})

describe('ksh', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/ksh'
  })
  beforeEach(() => {
    configFile = path.join(homeDir, '.kshrc')
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should put the new directory to the end of the PATH', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac
# pnpm end
`)
  })
  it('should create a shell script', async () => {
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'created',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'skipped',
      },
      oldSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    await expect(
      addDirToPosixEnvPath(pnpmHomeDir, {
        proxyVarName: 'PNPM_HOME',
        configSectionName: 'pnpm',
      })
    ).rejects.toThrowError(/The config file at/)
  })
  it('should not fail if setup is forced', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'modified',
      },
      oldSettings: `export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
})

describe('Dash', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/dash'
  })
  beforeEach(() => {
    configFile = path.join(homeDir, '.dashrc')
    process.env.ENV = configFile
  })
  it('should fail if there is no ENV env variable', async () => {
    delete process.env.ENV
    await expect(addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })).rejects.toThrowError(/The ENV environment variable is not set/)
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should put the new directory to the end of the PATH', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac
# pnpm end
`)
  })
  it('should create a shell script', async () => {
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'created',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'skipped',
      },
      oldSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    await expect(
      addDirToPosixEnvPath(pnpmHomeDir, {
        proxyVarName: 'PNPM_HOME',
        configSectionName: 'pnpm',
      })
    ).rejects.toThrowError(/The config file at/)
  })
  it('should not fail if setup is forced', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'modified',
      },
      oldSettings: `export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
})

describe('sh', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/sh'
  })
  beforeEach(() => {
    configFile = path.join(homeDir, '.shrc')
    process.env.ENV = configFile
  })
  it('should fail if there is no ENV env variable', async () => {
    delete process.env.ENV
    await expect(addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })).rejects.toThrowError(/The ENV environment variable is not set/)
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should put the new directory to the end of the PATH', async () => {
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PATH:$PNPM_HOME" ;;
esac
# pnpm end
`)
  })
  it('should create a shell script', async () => {
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'created',
      },
      oldSettings: '',
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'skipped',
      },
      oldSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    await expect(
      addDirToPosixEnvPath(pnpmHomeDir, {
        proxyVarName: 'PNPM_HOME',
        configSectionName: 'pnpm',
      })
    ).rejects.toThrowError(/The config file at/)
  })
  it('should not fail if setup is forced', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'modified',
      },
      oldSettings: `export PNPM_HOME="pnpm_home"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end`)
  })
})

describe('Fish', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/fish'
  })
  beforeEach(() => {
    configFile = path.join(homeDir, '.config/fish/config.fish')
  })
  it('should append to empty shell script', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: ``,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end
`)
  })
  it('should append to empty shell script without using a proxy varialbe', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: ``,
      newSettings: `if not string match -q -- "${pnpmHomeDir}" $PATH
  set -gx PATH "${pnpmHomeDir}" $PATH
end`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
if not string match -q -- "${pnpmHomeDir}" $PATH
  set -gx PATH "${pnpmHomeDir}" $PATH
end
# pnpm end
`)
  })
  it('should add the new dir to the end of PATH', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, '', 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'appended',
      },
      oldSettings: ``,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH $PATH "$PNPM_HOME"
end`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH $PATH "$PNPM_HOME"
end
# pnpm end
`)
  })
  it('should create a shell script', async () => {
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'created',
      },
      oldSettings: ``,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end`
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end
`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, `
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'skipped',
      },
      oldSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end`,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end`
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, `
# pnpm
set -gx PNPM_HOME "pnpm_home"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`, 'utf8')
    await expect(
      addDirToPosixEnvPath(pnpmHomeDir, {
        proxyVarName: 'PNPM_HOME',
        configSectionName: 'pnpm',
      })
    ).rejects.toThrowError(/The config file at/)
  })
  it('should not fail if setup is forced', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, `
# pnpm
set -gx PNPM_HOME "pnpm_home"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end`, 'utf8')
    const report = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(report).toStrictEqual({
      configFile: {
        path: configFile,
        changeType: 'modified',
      },
      oldSettings: `set -gx PNPM_HOME "pnpm_home"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end`,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end`
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end`)
  })
})
