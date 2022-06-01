import { addDirToPosixEnvPath, AddDirToPosixEnvPathOpts, PathExtenderPosixReport } from '@pnpm/os.env.path-extender-posix'
import { addDirToWindowsEnvPath, PathExtenderWindowsReport } from '@pnpm/os.env.path-extender-windows'

export interface PathExtenderReport {
  posixReport?: PathExtenderPosixReport
  windowsReport?: PathExtenderWindowsReport
}

export async function addDirToEnvPath(dir: string, opts: AddDirToPosixEnvPathOpts): Promise<PathExtenderReport> {
  if (process.platform === 'win32') {
    return {
      windowsReport: await addDirToWindowsEnvPath(dir, {
        position: opts.position,
        proxyVarName: opts.proxyVarName,
        overwriteProxyVar: opts.overwrite,
      }),
    }
  }
  return {
    posixReport: await addDirToPosixEnvPath(dir, opts),
  }
}
