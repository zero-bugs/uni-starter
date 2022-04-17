import {isMainThread, parentPort, threadId, Worker, workerData,} from "worker_threads";
import {fileURLToPath} from "url";

import {whSearchListDefault} from "./apiRequest.js";
import {configure, getLog4jsConfFile, getLogger, pmsClient,} from "./@utils/utils.js";
import {ApiKeyId, getApiEndpoint, getApiKey} from "./config/configFile.js";

const __filename = fileURLToPath(import.meta.url);

// init log4js
configure(getLog4jsConfFile());

let logger = getLogger(__filename);

function mainThread() {
    let step = 1100;
    let startIndex = -step + 200;
    let endIndex = 0;
    for (let i = 0; i < 3; ++i) {
        startIndex = startIndex + step;
        endIndex = endIndex + step;
        const worker = new Worker(__filename, {
            workerData: {
                purity: '001',
                category: '111',
                apikey: `${getApiKey()}`,
                sorting: "date_added",
                order: "desc",
                startPage: startIndex,
                endPage: endIndex,
            },
        });

        worker.on("exit", (code) => {
            console.log(`main: worker stopped with exit code ${code}`);
        });
        worker.on("message", (msg) => {
            console.log(`main: receive message: ${JSON.stringify(msg)}`);
        });

        process.on("unhandledRejection", (reason, promise) => {
            console.log(
                `system unhandledRejection :${reason}, msg ${promise.then((e) =>
                    console.log(e)
                )}`
            );
        });
        process.on("uncaughtException", (reason, promise) => {
            console.log(`system uncaughtException :${reason}, msg ${promise}`);
        });
    }
}

async function workerThead() {
    console.log(`worker: workerData ${JSON.stringify(workerData)}`);
    await whSearchListDefault(
        getApiEndpoint(ApiKeyId.WH_QUERY_01),
        workerData
    ).catch((e) => {
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

main().catch(async (reason) => {
    console.log(`main function execute failed, reason:${reason}`);
    console.log(`warning, closing client.....`)
    await pmsClient.$disconnect();
});