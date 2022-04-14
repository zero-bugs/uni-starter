import {isMainThread, parentPort, threadId, Worker, workerData} from 'worker_threads';
import {fileURLToPath} from 'url'

import {whSearchListDefault} from './apiRequest.js'
import {configure, getLog4jsConfFile, getLogger, pmsClient} from "./@utils/utils.js";
import {ApiKeyId, getApiEndpoint} from "./config/configFile.js";

const __filename = fileURLToPath(import.meta.url)

// init log4js
configure(getLog4jsConfFile());

let logger = getLogger(__filename)

function mainThread() {
    let step = 5;
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
                "endPage": endIndex,
                "sinceBegin": new Date("2022-01-01 00:00:00"),
                "sinceEnd": new Date(),
            }
        });

        worker.on('exit', code => {
            console.log(`main: worker stopped with exit code ${code}`);
        });
        worker.on('message', msg => {
            console.log(`main: receive message: ${JSON.stringify(msg)}`);
        });
    }
}

async function workerThead() {
    console.log(`worker: workerData ${JSON.stringify(workerData)}`);
    await whSearchListDefault(getApiEndpoint(ApiKeyId.WH_QUERY_01), workerData).catch(e => {
        logger.warn(`execute api:${ApiKeyId.WH_QUERY_01} failed`, e);
    });
    parentPort?.postMessage(`${threadId}, done worker...`);
}

async function main() {
    if (isMainThread) {
        mainThread();
    } else {
        await workerThead();
    }
}

main()
    .catch((e) => {
        throw e
    })
    .finally(async () => {
        await pmsClient.$disconnect();
    })