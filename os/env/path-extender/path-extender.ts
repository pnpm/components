import { addDirToPosixEnvPath, AddDirToPosixEnvPathOpts, PathExtenderPosixReport } from '@pnpm/os.env.path-extender-posix'
import { addDirToWindowsEnvPath, PathExtenderWindowsReport } from '@pnpm/os.env.path-extender-windows'

export type PathExtenderReport = Pick<PathExtenderPosixReport, 'oldSettings' | 'newSettings'> & Partial<Pick<PathExtenderPosixReport, 'configFile'>>

export async function addDirToEnvPath(dir: string, opts: AddDirToPosixEnvPathOpts): Promise<PathExtenderReport> {
  if (process.platform === 'win32') {
    return renderWindowsReport(await addDirToWindowsEnvPath(dir, {
        position: opts.position,
        proxyVarName: opts.proxyVarName,
        overwriteProxyVar: opts.overwrite,
      })
    )
  }
  return await addDirToPosixEnvPath(dir, opts)
}

export function renderWindowsReport (changedEnvVariables: PathExtenderWindowsReport): PathExtenderReport {
  const oldSettings = []
  const newSettings = []
  for (const changedEnvVariable of changedEnvVariables) {
    if (changedEnvVariable.oldValue) {
      oldSettings.push(`${changedEnvVariable.variable}=${changedEnvVariable.oldValue}`)
    }
    if (changedEnvVariable.newValue) {
      newSettings.push(`${changedEnvVariable.variable}=${changedEnvVariable.newValue}`)
    }
  }
  return {
    oldSettings: oldSettings.join('\n'),
    newSettings: newSettings.join('\n'),
  }
}
