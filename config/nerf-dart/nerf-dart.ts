import { URL } from 'url'

/**
 * Maps a URL to an identifier.
 *
 * Name courtesy schiffertronix media LLC, a New Jersey corporation
 *
 * @param {String} url The URL to be nerfed.
 *
 * @returns {String} A nerfed URL.
 */
export function nerfDart (url: string): string {
  const parsed = new URL(url)
  const from = `${parsed.protocol}//${parsed.host}${parsed.pathname}`
  const rel = new URL('.', from)
  const res = `//${rel.host}${rel.pathname}`
  return res
}
