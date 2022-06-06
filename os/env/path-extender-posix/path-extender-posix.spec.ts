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
  homedir['mockReturnValue'](homeDir)
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
export PATH="$PNPM_HOME:$PATH"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
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
export PATH="$PATH:$PNPM_HOME"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PATH:$PNPM_HOME"
# pnpm end`)
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
export PATH="$PNPM_HOME:$PATH"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
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
export PATH="$PNPM_HOME:$PATH"`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="pnpm_home"
export PATH="$PNPM_HOME:$PATH"
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
export PATH="$PNPM_HOME:$PATH"
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
export PATH="$PNPM_HOME:$PATH"`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
})

describe('Zsh', () => {
  let configFile!: string
  beforeAll(() => {
    process.env.SHELL = '/bin/zsh'
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
export PATH="$PNPM_HOME:$PATH"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync(configFile, `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
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
export PATH="$PNPM_HOME:$PATH"`,
      newSettings: `export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
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
set -gx PATH "$PNPM_HOME" $PATH`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
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
set -gx PATH $PATH "$PNPM_HOME"`,
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH $PATH "$PNPM_HOME"
# pnpm end`)
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
set -gx PATH "$PNPM_HOME" $PATH`
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync(configFile, `
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
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
set -gx PATH "$PNPM_HOME" $PATH`,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH`
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
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
set -gx PATH "$PNPM_HOME" $PATH
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
set -gx PATH "$PNPM_HOME" $PATH`,
      newSettings: `set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH`
    })
    const configContent = fs.readFileSync(configFile, 'utf8')
    expect(configContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
  })
})
