import { getAgent } from './agent'

jest.mock('agentkeepalive', () => {
  const MockHttp = mockHttpAgent('http')
  MockHttp['HttpsAgent'] = mockHttpAgent('https')
  return MockHttp
})
jest.mock('https-proxy-agent', () => mockHttpAgent('https-proxy'))

function mockHttpAgent (type: string) {
  return function Agent (opts: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return {
      ...opts,
      __type: type,
    }
  }
}

const OPTS = {
  agent: null,
  ca: 'ca',
  cert: 'cert',
  key: 'key',
  localAddress: 'localAddress',
  maxSockets: 5,
  strictSsl: true,
  timeout: 5,
}

test('all expected options passed down to HttpAgent', () => {
  expect(getAgent('http://foo.com/bar', OPTS)).toEqual({
    __type: 'http',
    localAddress: 'localAddress',
    maxSockets: 5,
    timeout: 6,
  })
})

test('all expected options passed down to HttpsAgent', () => {
  expect(getAgent('https://foo.com/bar', OPTS)).toEqual({
    __type: 'https',
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    localAddress: 'localAddress',
    maxSockets: 5,
    rejectUnauthorized: true,
    timeout: 6,
  })
})

test('all expected options passed down to proxy agent', () => {
  const opts = {
    httpsProxy: 'https://user:pass@my.proxy:1234/foo',
    noProxy: 'qar.com, bar.com',
    ...OPTS,
  }
  expect((getAgent('https://foo.com/bar', opts) as any).proxy).toEqual({
    ALPNProtocols: ['http 1.1'],
    auth: 'user:pass',
    ca: 'ca',
    cert: 'cert',
    host: 'my.proxy',
    key: 'key',
    localAddress: 'localAddress',
    maxSockets: 5,
    port: 1234,
    protocol: 'https:',
    rejectUnauthorized: true,
    timeout: 6,
  })
})

test("don't use a proxy when the URL is in noProxy", () => {
  const opts = {
    httpsProxy: 'https://user:pass@my.proxy:1234/foo',
    noProxy: 'foo.com, bar.com',
    ...OPTS,
  }
  expect(getAgent('https://foo.com/bar', opts)).toEqual({
    __type: 'https',
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    localAddress: 'localAddress',
    maxSockets: 5,
    rejectUnauthorized: true,
    timeout: 6,
  })
})

test('should return the correct client certificates', () => {
  const agent = getAgent('https://foo.com/bar', {
    clientCertificates: {
      '//foo.com/': {
        ca: 'ca',
        cert: 'cert',
        key: 'key',
      },
    },
  })

  expect(agent).toEqual({
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    localAddress: undefined,
    maxSockets: 50,
    rejectUnauthorized: undefined,
    timeout: 0,
    __type: 'https',
  })
})

test('should not return client certificates for a different host', () => {
  const agent = getAgent('https://foo.com/bar', {
    clientCertificates: {
      '//bar.com/': {
        ca: 'ca',
        cert: 'cert',
        key: 'key',
      },
    },
  })

  expect(agent).toEqual({
    localAddress: undefined,
    maxSockets: 50,
    rejectUnauthorized: undefined,
    timeout: 0,
    __type: 'https',
  })
})

test('scoped certificates override global certificates', () => {
  const agent = getAgent('https://foo.com/bar', {
    ca: 'global-ca',
    key: 'global-key',
    cert: 'global-cert',
    clientCertificates: {
      '//foo.com/': {
        ca: 'scoped-ca',
        cert: 'scoped-cert',
        key: 'scoped-key',
      },
    },
  })

  expect(agent).toEqual({
    ca: 'scoped-ca',
    cert: 'scoped-cert',
    key: 'scoped-key',
    localAddress: undefined,
    maxSockets: 50,
    rejectUnauthorized: undefined,
    timeout: 0,
    __type: 'https',
  })
})

test('select correct client certificates when host has a port', () => {
  const agent = getAgent('https://foo.com:1234/bar', {
    clientCertificates: {
      '//foo.com:1234/': {
        ca: 'ca',
        cert: 'cert',
        key: 'key',
      },
    },
  })

  expect(agent).toEqual({
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    localAddress: undefined,
    maxSockets: 50,
    rejectUnauthorized: undefined,
    timeout: 0,
    __type: 'https',
  })
})

test('select correct client certificates when host has a path', () => {
  const agent = getAgent('https://foo.com/bar/baz', {
    clientCertificates: {
      '//foo.com/': {
        ca: 'ca',
        cert: 'cert',
        key: 'key',
      },
    },
  })

  expect(agent).toEqual({
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    localAddress: undefined,
    maxSockets: 50,
    rejectUnauthorized: undefined,
    timeout: 0,
    __type: 'https',
  })
})

test('select correct client certificates when host has a path and the cert contains a path', () => {
  const agent = getAgent('https://foo.com/bar/baz', {
    clientCertificates: {
      '//foo.com/bar/': {
        ca: 'ca',
        cert: 'cert',
        key: 'key',
      },
    },
  })

  expect(agent).toEqual({
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    localAddress: undefined,
    maxSockets: 50,
    rejectUnauthorized: undefined,
    timeout: 0,
    __type: 'https',
  })
})