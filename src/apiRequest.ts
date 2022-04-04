import fetch from 'node-fetch' ;
import httpsAgent from 'https-proxy-agent';

const {HttpsProxyAgent} = httpsAgent

fetch('url', {
    agent: new HttpsProxyAgent("http://127.0.0.1:80"),
}).then((res: { json: () => any; }) => res.json())
    .then((json: any) => console.log(json));
