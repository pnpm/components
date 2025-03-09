import { PnpmError } from '@pnpm/error'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
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
  clientCertificates?: {
    [registryUrl: string]: {
      cert: string
      key: string
      ca?: string
    }
  }
}

export function getProxyAgent (uri: string, opts: ProxyAgentOptions) {
  const parsedUri = new URL(uri)
  const pxuri = getProxyUri(parsedUri, opts)
  if (!pxuri) return
  const isHttps = parsedUri.protocol === 'https:'

  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
  const key = [
    `https:${isHttps.toString()}`,
    `proxy:${pxuri.protocol}//${pxuri.username}:${pxuri.password}@${pxuri.host}:${pxuri.port}`,
    `local-address:${opts.localAddress ?? '>no-local-address<'}`,
    `strict-ssl:${
      isHttps ? Boolean(opts.strictSsl).toString() : '>no-strict-ssl<'
    }`,
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
    return undefined
  }

  if (!proxy.includes('://')) {
    proxy = `${protocol}//${proxy}`
  }

  if (typeof proxy !== 'string') {
    return proxy
  }

  try {
    return new URL(proxy)
  } catch (err) {
    throw new PnpmError('INVALID_PROXY', "Couldn't parse proxy URL", {
      hint: `If your proxy URL contains a username and password, make sure to URL-encode them (you may use the encodeURIComponent function). For instance, https-proxy=https://use%21r:pas%2As@my.proxy:1234/foo. Do not encode the colon (:) between the username and password.`,
    })
  }
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
) {
  const popts = {
    auth: getAuth(proxyUrl),
    ca: opts.ca,
    cert: opts.cert,
    key: opts.key,
    localAddress: opts.localAddress,
    maxSockets: opts.maxSockets ?? DEFAULT_MAX_SOCKETS,
    rejectUnauthorized: opts.strictSsl,
    timeout:
      typeof opts.timeout !== 'number' || opts.timeout === 0
        ? 0
        : opts.timeout + 1,
  }

  if (proxyUrl.protocol === 'http:' || proxyUrl.protocol === 'https:') {
    if (!isHttps) {
      return new HttpProxyAgent(proxyUrl, popts)
    } else {
      return new PatchedHttpsProxyAgent(proxyUrl, popts)
    }
  }
  if (proxyUrl.protocol?.startsWith('socks')) {
    return new SocksProxyAgent(proxyUrl, popts)
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

const extraOpts = Symbol('extra agent opts')

// This is a workaround for this issue: https://github.com/TooTallNate/node-https-proxy-agent/issues/89
class PatchedHttpsProxyAgent<Uri extends string> extends HttpsProxyAgent<Uri> {
  constructor (proxyUrl: Uri | URL, opts: any) {
    super(proxyUrl, opts)

    this[extraOpts] = opts
  }

  connect (req: any, opts: any) {
    return super.connect(req, { ...this[extraOpts], ...opts })
  }
}
