import {ApiKeyId, getApiKey, TaskKeyId} from "./config/ConfigFile.js";
import {UniWorkerPool, WorkerTaskInfo} from "./@pool/WorkPool.js";

const POOL_SIZE = 3;

export async function main() {
    const pool = new UniWorkerPool(POOL_SIZE, 100);
    // let step = 2620;
    // let startIndex = -step;
    // let endIndex = 0;
    // for (let i = 0; i < POOL_SIZE; ++i) {
    //     startIndex = startIndex + step;
    //     endIndex = endIndex + step;
    //     pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_QUERY_ALL_01, {
    //         purity: '100',
    //         category: '111',
    //         apikey: `${getApiKey()}`,
    //         apiId: ApiKeyId.WH_QUERY_01,
    //         sorting: "date_added",
    //         order: "desc",
    //         startPage: startIndex,
    //         endPage: endIndex,
    //     }));
    // }

    pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ALL_01, {
        purity: 'sketchy',
        category: 'people',
        start: 71201,
        end: 75000,
        limit: 200
    }));

    pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ALL_01, {
        purity: 'sketchy',
        category: 'people',
        start: 124000,
        end: 140000,
        limit: 200
    }));


    pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ALL_01, {
        purity: 'sketchy',
        category: 'people',
        start: 140000,
        end: 155061,
        limit: 200
    }));

}
