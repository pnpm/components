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

