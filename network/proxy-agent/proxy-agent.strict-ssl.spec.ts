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
})
