import {isMainThread, parentPort, Worker, workerData} from 'worker_threads';
import fs from "fs";
import {fileURLToPath} from 'url'

import {apiSearch} from './apiRequest.js'
import {configure, getLog4jsConfFile, getLogger} from "./@utils/utils.js";

const __filename = fileURLToPath(import.meta.url)

// init log4js
configure(getLog4jsConfFile());

let logger = getLogger(__filename)

function mainThread() {
    for (let i = 0; i < 1; ++i) {
        const worker = new Worker(__filename, {
            workerData: {
                startPage: 0,
            }
        });
        worker.on('exit', code => {
            console.log(`main: worker stopped with exit code ${code}`);
        });
        worker.on('message', msg => {
            console.log(`main: receive ${msg}`);
            worker.postMessage(msg + 1);
        });
    }
}

function workerThead() {
    console.log(`worker: workerDate ${workerData}`);
    parentPort?.on('message', msg => {
        console.log(`worker: receive ${msg}`);
        let startPage = workerData.startPage;
        let link = workerData.urlLink;
        if (startPage !== 0) {
            link += `&page=${startPage}`
        }
        apiSearch(link)
    });
    parentPort?.postMessage(workerData);
}

if (isMainThread) {
    mainThread();
} else {
    workerThead();
}
