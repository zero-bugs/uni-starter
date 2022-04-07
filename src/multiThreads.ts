import {isMainThread, parentPort, Worker, workerData} from 'worker_threads';
import fs from "fs";
import {fileURLToPath} from 'url'

import {whSearchListDefault} from './apiRequest.js'
import {configure, getLog4jsConfFile, getLogger} from "./@utils/utils.js";
import {ApiKeyId, getApiEndpoint} from "./config/configFile.js";
import CustomEvent from "./config/customEvent";

const __filename = fileURLToPath(import.meta.url)

// init log4js
configure(getLog4jsConfFile());

let logger = getLogger(__filename)

function mainThread() {
    let step = 10;
    let startIndex = 0;
    let endIndex = step;

    for (let i = 0; i < 3; ++i) {
        startIndex = startIndex + i * step;
        endIndex = endIndex + startIndex;
        const worker = new Worker(__filename, {
            workerData: {
                "purity": 111,
                "sorting": 'date_added',
                "order": 'desc',
                "startPage": startIndex,
                "endPage": endIndex
            }
        });
        worker.on('exit', code => {
            console.log(`main: worker stopped with exit code ${code}`);
        });
        worker.on('message', msg => {
            console.log(`main: receive message: ${msg}`);
        });
        worker.on(CustomEvent.CLIENT_RES.valueOf(), msg => {
            console.log(`main: receive ${CustomEvent.CLIENT_RES}: ${JSON.stringify(msg)}`);
        })
        worker.on(CustomEvent.CLIENT_ERR.valueOf(), msg => {
            console.log(`main: receive ${CustomEvent.CLIENT_ERR}: ${JSON.stringify(msg)}`);
        });
    }
}

function workerThead() {
    console.log(`worker: workerData ${JSON.stringify(workerData)}`);
    whSearchListDefault(getApiEndpoint(ApiKeyId.WH_QUERY_01), workerData).catch(e => {
        logger.warn(`execute api:${ApiKeyId.WH_QUERY_01} failed`, e);
    });
    parentPort?.postMessage('done worker...');
}

if (isMainThread) {
    mainThread();
} else {
    workerThead();
}
