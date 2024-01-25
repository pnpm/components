import { parseUri } from './url';

describe('parseUri', () => {
  it('should parse a simple URL', () => {
    const uri = 'https://example.com';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a port', () => {
    const uri = 'https://example.com:8080';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com:8080/',
      hostOnlyDomain: '//example.com:8080/',
      host: 'example.com',
      port: '8080',
      pathname: '/',
      search: '',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a search', () => {
    const uri = 'https://example.com?foo=bar';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/',
      search: '?foo=bar',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a hash', () => {
    const uri = 'https://example.com#foo';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/',
      search: '',
      hash: '#foo',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a path', () => {
    const uri = 'https://example.com/path/to/file';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/path/to/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/path/to/file',
      search: '',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a query string', () => {
    const uri = 'https://example.com?foo=bar&baz=qux';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/',
      search: '?foo=bar&baz=qux',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a fragment identifier', () => {
    const uri = 'https://example.com#foo';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/',
      search: '',
      hash: '#foo',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with a username and password', () => {
    const uri = 'https://username:password@example.com';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL that its an IP with port', () => {
    const uri = 'https://192.168.1.1:8080';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//192.168.1.1:8080/',
      hostOnlyDomain: '//192.168.1.1:8080/',
      host: '192.168.1.1',
      port: '8080',
      pathname: '/',
      search: '',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a URL with port and subpaths ', () => {
    const uri = 'https://example.com:8080/path/to/file';
    const expected = {
      raw: uri,
      protocol: 'https:',
      nerf: '//example.com:8080/path/to/',
      host: 'example.com',
      hostOnlyDomain: '//example.com:8080/',
      port: '8080',
      pathname: '/path/to/file',
      search: '',
      hash: '',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });
});
