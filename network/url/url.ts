import nerfDart from 'nerf-dart';

export interface ParsedUri {
  /**
   * The url as string
   */
  raw: string;
  /**
   * The protocol of the url
   */
  protocol: string;
  /**
   * The nerf dart of the url
   * @example https://example.com -> //example.com/
   * @example https://example.com:8080/path/to/file  -> //example.com:8080/path/to/
   */
  nerf: string;
  /**
   * The host of the url
   * @example https://example.com -> example.com
   */
  host: string;
  /**
   * The host of the url with port
   * @example https://example.com:8080 -> //example.com:8080/
   */
  hostOnlyDomain: string;
  /**
   * The port of the url
   * @example https://example.com:8080 -> 8080
   */
  port: string;
  /**
   * The pathname of the url
   * @example https://example.com/path/to/file -> /path/to/file
   */
  pathname: string;
  /**
   * The search of the url
   * @example https://example.com/path/to/file?search=query -> ?search=query
   */
  search: string;
  /**
   * The hash of the url
   * @example https://example.com/path/to/file#hash -> #hash
   */
  hash: string;
}

export function parseUri(uri: string): ParsedUri {
  const parsed = new URL(uri);
  return {
    raw: uri,
    protocol: parsed.protocol,
    nerf: nerfDart(uri),
    host: parsed.hostname,
    hostOnlyDomain: convertToDomain(parsed),
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
  };
}

function convertToDomain(url: URL): string {
  let result = `//${url.hostname}`;
  if (url.port) {
    result += `:${url.port}`;
  }
  return `${result}/`;
}
