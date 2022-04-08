import fetch, {RequestInit} from 'node-fetch';
import {parentPort, threadId} from 'worker_threads';

import {PrismaClient, ImageCreateInput} from '@prisma/client';

import CustomEvent from "./config/customEvent.js";

import {delay, getDbClient, getLogger} from "./@utils/utils.js";
import {getHttpsProxy} from "./config/proxyConfig.js";
import {randomInt} from "crypto";

let logger4js = getLogger('app')

class ResultResp {
    type: string;
    url: string;
    httpCode: number;
    threadId: number;
    
    constructor(type: string, url: string, status: number, threadId: number) {
        this.type = type;
        this.url = url;
        this.httpCode = status;
        this.threadId = threadId;
    }
}

/**
 * wh: default search
 * @param endpoint
 * @param queryParam
 */
export async function whSearchListDefault(endpoint: string, queryParam = {
    "purity": 111,
    "sorting": 'date_added',
    "order": 'desc',
    "startPage": 1,
    "endPage": 1
}) {
    let page = queryParam.startPage === 0 ? 1 : queryParam.startPage;
    let urlLink = `${endpoint}?purity=${queryParam.purity}&sorting=${queryParam.sorting}&order=${queryParam.order}`
    while (page < queryParam.endPage) {
        let pageUrlLink = `${urlLink}&page=${page}`
        page += 1;
        
        let options: RequestInit = {};
        let proxy = getHttpsProxy();
        if (proxy) {
            options.agent = getHttpsProxy();
        }
        
        await fetch(pageUrlLink, options).then(res => {
            let result = new ResultResp(CustomEvent.CLIENT_ERR, pageUrlLink,
                res.status, threadId);
            if (res.status !== 200 && res.status !== 201) {
                parentPort?.postMessage(result);
                logger4js.warn('worker execute failed request url:%s', endpoint)
                throw new Error(`http error:${res.status}, ${res.body}`);
            }
            parentPort?.postMessage(result);
            return res.json();
        }).then(res => {
            let imgs: ImageCreateInput[] = [
            
            ];
            
            
            // put into db
            let pmsClient = getDbClient();
        }).catch(e => {
            logger4js.warn("http request error for url:%s", pageUrlLink, e);
        });
        
        await delay(randomInt(3000, 6000));
    }
}
