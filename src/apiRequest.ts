import fetch from 'node-fetch';
import {parentPort} from 'worker_threads';

import CustomEvent from "./config/customEvent.js";

import {getLogger} from "./@utils/utils.js";
import {getHttpsProxy} from "./config/proxyConfig.js";

let logger4js = getLogger('app')

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
    while (queryParam.startPage < queryParam.endPage) {
        await fetch(endpoint, {
            agent: getHttpsProxy(),
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                parentPort?.emit(CustomEvent.CLIENT_ERR, [{
                    'url': endpoint,
                    'status': res.status
                }])
                logger4js.warn('worker execute failed request url:%s', endpoint)
                throw new Error(`http error:${res.status}, ${res.body}`);
            }
            parentPort?.emit(CustomEvent.CLIENT_RES, [{
                'url': endpoint,
                'status': res.status
            }])
            return res.json();
        }).then((res)=>{
            setTimeout(() => {}, 5000);
        });
    }
}

