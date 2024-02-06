import fs from 'graceful-fs'

export function readCAFileSync (filePath: string): string[] | undefined {
  try {
    let contents = fs.readFileSync(filePath, 'utf8')
    // Normalize line endings to Unix-style
    contents = contents.replace(/\r\n/g, '\n');
    const delim = '-----END CERTIFICATE-----'
    const output = contents
      .split(delim)
      .filter((ca) => Boolean(ca.trim()))
      .map((ca) => `${ca.trimLeft()}${delim}`)
    return output
  } catch (err: any) { // eslint-disable-line
    if (err.code === 'ENOENT') return undefined
    throw err
  }
}
