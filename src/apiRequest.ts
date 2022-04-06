import fetch from 'node-fetch';
import httpsAgent from 'https-proxy-agent';
import {parentPort} from 'worker_threads';

import pkg from 'log4js';
const { configure, getLogger } = pkg;

import CustomEvent from "./config/customEvent.js";
import log4jsConfig from "./config/log4jsConfig.js";

configure(log4jsConfig)
let logger4js = getLogger('app')

export async function apiSearch(link: string,) {
    await fetch(link, {
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

