import { addDirToPosixEnvPath,  AddDirToPosixEnvPathOpts } from '@pnpm/os.env.path-extender-posix'
import { addDirToWindowsEnvPath } from '@pnpm/os.env.path-extender-windows'

export function addDirToEnvPath(dir: string, opts: AddDirToPosixEnvPathOpts) {
  if (process.platform === 'win32') {
    return addDirToWindowsEnvPath(dir, {
      position: opts.position,
      proxyVarName: opts.proxyVarName,
      overwriteProxyVar: opts.overwrite,
    })
  }
  return addDirToPosixEnvPath(dir, opts)
}
