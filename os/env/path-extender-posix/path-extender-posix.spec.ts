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
  beforeAll(() => {
    process.env.SHELL = '/bin/bash'
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync('.bashrc', '', 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Appended new /)
    const bashRCContent = fs.readFileSync('.bashrc', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should put the new directory to the end of the PATH', async () => {
    fs.writeFileSync('.bashrc', '', 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(output).toMatch(/^Appended new /)
    const bashRCContent = fs.readFileSync('.bashrc', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PATH:$PNPM_HOME"
# pnpm end`)
  })
  it('should create a shell script', async () => {
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Created /)
    const bashRCContent = fs.readFileSync('.bashrc', 'utf8')
    expect(bashRCContent).toEqual(`# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync('.bashrc', `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`, 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Configuration already up-to-date /)
    const bashRCContent = fs.readFileSync('.bashrc', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.writeFileSync('.bashrc', `
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
    fs.writeFileSync('.bashrc', `
# pnpm
export PNPM_HOME="pnpm_home"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`, 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Replaced /)
    const bashRCContent = fs.readFileSync('.bashrc', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
})

describe('Zsh', () => {
  beforeAll(() => {
    process.env.SHELL = '/bin/zsh'
  })
  it('should append to empty shell script', async () => {
    fs.writeFileSync('.zshrc', '', 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Appended new /)
    const bashRCContent = fs.readFileSync('.zshrc', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.writeFileSync('.zshrc', `
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`, 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Configuration already up-to-date /)
    const bashRCContent = fs.readFileSync('.zshrc', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
export PNPM_HOME="${pnpmHomeDir}"
export PATH="$PNPM_HOME:$PATH"
# pnpm end`)
  })
})

describe('Fish', () => {
  beforeAll(() => {
    process.env.SHELL = '/bin/fish'
  })
  it('should append to empty shell script', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync('.config/fish/config.fish', '', 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Appended new /)
    const bashRCContent = fs.readFileSync('.config/fish/config.fish', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
  })
  it('should add the new dir to the end of PATH', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync('.config/fish/config.fish', '', 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
      position: 'end',
    })
    expect(output).toMatch(/^Appended new /)
    const bashRCContent = fs.readFileSync('.config/fish/config.fish', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH $PATH "$PNPM_HOME"
# pnpm end`)
  })
  it('should create a shell script', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Created /)
    const bashRCContent = fs.readFileSync('.config/fish/config.fish', 'utf8')
    expect(bashRCContent).toEqual(`# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
  })
  it('should make no changes to a shell script that already has the necessary configurations', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync('.config/fish/config.fish', `
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`, 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Configuration already up-to-date /)
    const bashRCContent = fs.readFileSync('.config/fish/config.fish', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
  })
  it('should fail if the shell already has PNPM_HOME set to a different directory', async () => {
    fs.mkdirSync('.config/fish', { recursive: true })
    fs.writeFileSync('.config/fish/config.fish', `
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
    fs.writeFileSync('.config/fish/config.fish', `
# pnpm
set -gx PNPM_HOME "pnpm_home"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`, 'utf8')
    const output = await addDirToPosixEnvPath(pnpmHomeDir, {
      proxyVarName: 'PNPM_HOME',
      overwrite: true,
      configSectionName: 'pnpm',
    })
    expect(output).toMatch(/^Replaced /)
    const bashRCContent = fs.readFileSync('.config/fish/config.fish', 'utf8')
    expect(bashRCContent).toEqual(`
# pnpm
set -gx PNPM_HOME "${pnpmHomeDir}"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end`)
  })
})
