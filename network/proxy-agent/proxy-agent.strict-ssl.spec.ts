import fetch from 'node-fetch'
import { getProxyAgent } from './proxy-agent'
import Proxy from 'proxy'

describe('untrusted certificate', () => {
  let proxy: Proxy
  let proxyPort: number
  beforeAll(function(done) {
    // setup HTTP proxy server
    proxy = Proxy();
    proxy.listen(function() {
    proxyPort = proxy.address().port;
    done();
    });
  });
  afterAll(function(done) {
    proxy.once('close', function() {
      done();
    });
    proxy.close();
  });
  it('should not throw an error if strictSsl is set to false', async () => {
    const url = 'https://self-signed.badssl.com'
    const agent = getProxyAgent(url, {
      httpsProxy: `http://127.0.0.1:${proxyPort}`,
      strictSsl: false,
    })
    await fetch(url, {
      agent,
    })
  })
  it('should throw an error if strictSsl is not set', async () => {
     const url = 'https://self-signed.badssl.com'
     const agent = getProxyAgent(url, {
       httpsProxy: `http://127.0.0.1:${proxyPort}`,
       strictSsl: true,
     })
     await expect(fetch(url, {
       agent,
     })).rejects.toThrow(/self signed certificate/)
   })
})
