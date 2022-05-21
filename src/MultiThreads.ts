import {TaskKeyId} from "./config/ConfigFile.js";
import {WorkerPool, WorkerTaskInfo} from "./@pool/WorkPool.js";

const POOL_SIZE = 3;

export async function main() {
    const pool = new WorkerPool(POOL_SIZE, 100);
    // let step = 1100;
    // let startIndex = -step;
    // let endIndex = 0;
    // for (let i = 0; i < POOL_SIZE; ++i) {
    //     startIndex = startIndex + step;
    //     endIndex = endIndex + step;
    //     pool.runTask(new WorkerTaskInfo(ApiKeyId.WH_QUERY_01, {
    //         purity: '001',
    //         category: '111',
    //         apikey: `${getApiKey()}`,
    //         sorting: "date_added",
    //         order: "desc",
    //         startPage: startIndex,
    //         endPage: endIndex,
    //     }));
    // }

    // pool.runTask(new WorkerTaskInfo(ApiKeyId.WH_QUERY_01, {
    //     purity: '001',
    //     category: '111',
    //     apikey: `${getApiKey()}`,
    //     sorting: "date_added",
    //     order: "desc",
    //     startPage: 1,
    //     endPage: 1100,
    // }));

    pool.runTask(new WorkerTaskInfo(TaskKeyId.CM_DOWNLOAD_01, {
        purity: 'nsfw',
        category: 'people',
        start: 0,
        end: 5000,
        limit: 10
    }));
    pool.runTask(new WorkerTaskInfo(TaskKeyId.CM_DOWNLOAD_01, {
        purity: 'nsfw',
        category: 'people',
        start: 5000,
        end: 10000,
        limit: 10
    }));
    pool.runTask(new WorkerTaskInfo(TaskKeyId.CM_DOWNLOAD_01, {
        purity: 'nsfw',
        category: 'people',
        start: 10000,
        end: 15000,
        limit: 10
    }));
}
