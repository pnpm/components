import fetch from 'node-fetch'
import { getProxyAgent } from './proxy-agent'
import Proxy from 'proxy'

describe('untrusted certificate', () => {
  let proxy: any
  let proxyPort: number
  beforeAll((done) => {
    // setup HTTP proxy server
    proxy = Proxy();
    proxy.listen(() => {
      proxyPort = proxy.address().port;
      done();
    });
  });
  afterAll((done) => {
    proxy.once('close', done);
    proxy.close();
  });
  it('should not throw an error if strictSsl is set to false', async () => {
    const url = 'https://self-signed.badssl.com'
    const agent: any = getProxyAgent(url, {
      httpsProxy: `http://127.0.0.1:${proxyPort}`,
      strictSsl: false,
    })
    await fetch(url, { agent })
  })
  it('should throw an error if strictSsl is not set', async () => {
     const url = 'https://self-signed.badssl.com'
     const agent: any = getProxyAgent(url, {
       httpsProxy: `http://127.0.0.1:${proxyPort}`,
       strictSsl: true,
     })
     await expect(fetch(url, { agent })).rejects.toThrow(/self[- ]signed certificate/)
   })
})