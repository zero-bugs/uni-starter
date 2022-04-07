import fs from 'fs'
import httpsAgent from "https-proxy-agent";

class ProxyConfig {
    proxySwitch: boolean = false;
    http_proxy: string;
    https_proxy: string;
    no_proxy: string;
    
    constructor() {
        let proxyJson = JSON.parse(fs.readFileSync('', 'utf-8'));
        this.http_proxy = process.env.http_proxy || process.env.HTTP_PROXY || proxyJson['http_proxy'];
        this.https_proxy = process.env.https_proxy || process.env.HTTPS_PROXY || proxyJson['https_proxy'];
        this.no_proxy = process.env.no_proxy || process.env.NO_PROXY || proxyJson['no_proxy'];
        this.proxySwitch = proxyJson['proxy'];
    }
}

const proxyConfig = new ProxyConfig();

export function getHttpsProxy(): httpsAgent.HttpsProxyAgent | boolean {
    if (!proxyConfig.proxySwitch) {
        return false;
    }
    return new httpsAgent.HttpsProxyAgent(proxyConfig.https_proxy);
}

export function getHttpProxy(): httpsAgent.HttpsProxyAgent | boolean {
    if (!proxyConfig.proxySwitch) {
        return false;
    }
    return new httpsAgent.HttpsProxyAgent(proxyConfig.http_proxy);
}
