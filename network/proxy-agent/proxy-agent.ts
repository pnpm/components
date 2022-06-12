import createHttpProxyAgent, { HttpProxyAgent } from 'http-proxy-agent'
import createHttpsProxyAgent, { HttpsProxyAgent } from 'https-proxy-agent'
import createSocksProxyAgent, { SocksProxyAgent } from 'socks-proxy-agent'
import LRU from 'lru-cache'

const DEFAULT_MAX_SOCKETS = 50

const AGENT_CACHE = new LRU({ max: 50 })

export interface ProxyAgentOptions {
  ca?: string | string[]
  cert?: string | string[]
  httpProxy?: string
  httpsProxy?: string
  key?: string
  localAddress?: string
  maxSockets?: number
  noProxy?: boolean | string
  strictSsl?: boolean
  timeout?: number
}

export type GetProxyAgentResult = HttpProxyAgent | HttpsProxyAgent | SocksProxyAgent | undefined

export function getProxyAgent (uri: string, opts: ProxyAgentOptions): GetProxyAgentResult {
  const parsedUri = new URL(uri)
  const pxuri = getProxyUri(parsedUri, opts)
  if (!pxuri) return
  const isHttps = parsedUri.protocol === 'https:'

  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
  const key = [
    `https:${isHttps.toString()}`,
    `proxy:${pxuri.protocol}//${pxuri.username}:${pxuri.password}@${pxuri.host}:${pxuri.port}`,
    `local-address:${opts.localAddress ?? '>no-local-address<'}`,
    `strict-ssl:${isHttps ? Boolean(opts.strictSsl).toString() : '>no-strict-ssl<'}`,
    `ca:${(isHttps && opts.ca?.toString()) || '>no-ca<'}`,
    `cert:${(isHttps && opts.cert?.toString()) || '>no-cert<'}`,
    `key:${(isHttps && opts.key) || '>no-key<'}`,
  ].join(':')
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

  if (AGENT_CACHE.peek(key)) {
    return AGENT_CACHE.get(key)
  }
  const proxy = getProxy(pxuri, opts, isHttps)
  AGENT_CACHE.set(key, proxy)
  return proxy
}

function getProxyUri (
  uri: URL,
  opts: {
    httpProxy?: string
    httpsProxy?: string
  }
): URL | undefined {
  const { protocol } = uri

  let proxy: string | undefined
  switch (protocol) {
  case 'http:': {
    proxy = opts.httpProxy
    break
  }
  case 'https:': {
    proxy = opts.httpsProxy
    break
  }
  }

  if (!proxy) {
    return null
  }

  if (!proxy.includes('://')) {
    proxy = `${protocol}//${proxy}`
  }

  const parsedProxy = (typeof proxy === 'string') ? new URL(proxy) : proxy

  return parsedProxy
}

function getProxy (
  proxyUrl: URL,
  opts: {
    ca?: string | string[]
    cert?: string | string[]
    key?: string
    timeout?: number
    localAddress?: string
    maxSockets?: number
    strictSsl?: boolean
  },
  isHttps: boolean
): GetProxyAgentResult {
  const popts = {
    auth: getAuth(proxyUrl),
    ca: opts.ca,
    cert: opts.cert,
    host: proxyUrl.hostname,
    key: opts.key,
    localAddress: opts.localAddress,
    maxSockets: opts.maxSockets ?? DEFAULT_MAX_SOCKETS,
    path: proxyUrl.pathname,
    port: proxyUrl.port,
    protocol: proxyUrl.protocol,
    rejectUnauthorized: opts.strictSsl,
    timeout: typeof opts.timeout !== 'number' || opts.timeout === 0 ? 0 : opts.timeout + 1,
  }

  if (proxyUrl.protocol === 'http:' || proxyUrl.protocol === 'https:') {
    if (!isHttps) {
      return createHttpProxyAgent(popts)
    } else {
      return createHttpsProxyAgent(popts)
    }
  }
  if (proxyUrl.protocol?.startsWith('socks')) {
    return createSocksProxyAgent(popts)
  }
  return undefined
}

function getAuth (user: { username?: string, password?: string }) {
  if (!user.username) {
    return undefined
  }
  let auth = user.username
  if (user.password) {
    auth += `:${user.password}`
  }
  return decodeURIComponent(auth)
}
