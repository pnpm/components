export function createAllowBuildFunction (
  opts: {
    neverBuiltDependencies?: string[]
    onlyBuiltDependencies?: string[]
  }
): undefined | ((pkgName: string) => boolean) {
  if (opts.neverBuiltDependencies != null && opts.neverBuiltDependencies.length > 0) {
    const neverBuiltDependencies = new Set(opts.neverBuiltDependencies)
    return (pkgName) => !neverBuiltDependencies.has(pkgName)
  } else if (opts.onlyBuiltDependencies != null) {
    const onlyBuiltDependencies = new Set(opts.onlyBuiltDependencies)
    return (pkgName) => onlyBuiltDependencies.has(pkgName)
  }
  return undefined
}
