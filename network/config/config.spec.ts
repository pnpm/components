import { parseUri, pickSettingByUrl } from './config';

describe('parseUri', () => {
  it('should parse a simple config', () => {
    const uri = 'https://example.com';
    const expected = {
      raw: 'https://example.com/',
      parsed: new URL(uri),
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      withoutPort: 'https://example.com/',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a config with a port', () => {
    const uri = 'https://example.com:8080';
    const expected = {
      raw: 'https://example.com:8080/',
      parsed: new URL(uri),
      nerf: '//example.com:8080/',
      host: 'example.com',
      hostOnlyDomain: '//example.com:8080/',
      withoutPort: 'https://example.com/',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a config with a path', () => {
    const uri = 'https://example.com/path/to/file';
    const expected = {
      raw: 'https://example.com/path/to/file',
      parsed: new URL(uri),
      nerf: '//example.com/path/to/file/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      withoutPort: 'https://example.com/path/to/file',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a config with a query string', () => {
    const uri = 'https://example.com?foo=bar';
    const expected = {
      raw: 'https://example.com/?foo=bar',
      parsed: new URL(uri),
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      withoutPort: 'https://example.com/?foo=bar',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });

  it('should parse a config with a fragment identifier', () => {
    const uri = 'https://example.com#fragment';
    const expected = {
      raw: 'https://example.com/#fragment',
      parsed: new URL(uri),
      nerf: '//example.com/',
      host: 'example.com',
      hostOnlyDomain: '//example.com/',
      withoutPort: 'https://example.com/#fragment',
    };
    const actual = parseUri(uri);
    expect(actual).toEqual(expected);
  });
});

describe('pickSettingByUrl', () => {
  test('should return undefined if generic object is undefined', () => {
    expect(pickSettingByUrl(undefined, 'https://example.com')).toBeUndefined();
  });

  test('should return the exact match from the generic object', () => {
    const settings = { 'https://example.com/': 'ExampleSetting' };
    expect(pickSettingByUrl(settings, 'https://example.com')).toBe(
      'ExampleSetting'
    );
  });

  test('should return a match using nerf dart', () => {
    const settings = { '//example.com/': 'NerfDartSetting' };
    expect(
      pickSettingByUrl(settings, 'https://example.com/path/to/resource')
    ).toBe('NerfDartSetting');
  });

  test('should return a match using withoutPort', () => {
    const settings = {
      'https://example.com/path/to/resource/': 'WithoutPortSetting',
    };
    expect(
      pickSettingByUrl(settings, 'https://example.com:8080/path/to/resource')
    ).toBe('WithoutPortSetting');
  });

  test('should return undefined if no match is found', () => {
    const settings = { 'https://example.com/': 'ExampleSetting' };
    expect(pickSettingByUrl(settings, 'https://nomatch.com')).toBeUndefined();
  });

  test('should recursively match using withoutPort', () => {
    const settings = { 'https://example.com/': 'RecursiveSetting' };
    expect(pickSettingByUrl(settings, 'https://example.com:8080')).toBe(
      'RecursiveSetting'
    );
  });
});
