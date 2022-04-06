import fetch from 'node-fetch' ;
import httpsAgent from 'https-proxy-agent';
import CustomEvent from "./customEvent"
import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';

import logger4js from "./config/log4jsConfig";

const {HttpsProxyAgent} = httpsAgent

logger4js.warn("ffafa{},{}", 1,2);

async function apiSearch(link: string,) {
    await fetch(link, {
        agent: new HttpsProxyAgent("xx"),
    }).then(res => {
        if (res.status !== 200 && res.status !== 201) {
            parentPort?.emit(CustomEvent.CLIENT_ERR, {
                'url': link,
                'status': res.status
            })
            logger4js.warn('worker execute failed request url:[]', link)
            return;
        }
        parentPort?.postMessage(res.json());
    });
}

