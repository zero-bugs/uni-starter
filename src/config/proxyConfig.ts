class ProxyConfig {
    proxySwitch: boolean = false;
    http_proxy: string = process.env.http_proxy || process.env.HTTP_PROXY || "http://127.0.0.1:80";
    https_proxy: string = process.env.https_proxy || process.env.HTTPS_PROXY || "http://127.0.0.1:80";
    no_proxy: string = process.env.no_proxy || process.env.NO_PROXY || "";
    
    constructor() {
    }
}

export default ProxyConfig;
