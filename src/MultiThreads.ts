import {getApiKey, TaskKeyId} from "./config/ConfigFile.js";
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
    //         purity: '001',
    //         category: '111',
    //         apikey: `${getApiKey()}`,
    //         apiId: ApiKeyId.WH_QUERY_01,
    //         sorting: "date_added",
    //         order: "desc",
    //         startPage: startIndex,
    //         endPage: endIndex,
    //         sinceBegin: new Date("2022-05-01 00:00:00")
    //     }));
    // }

    // pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ALL_01, {
    //     purity: 'nsfw',
    //     category: 'anime',
    //     start: 0,
    //     end: 5000,
    //     limit: 200
    // }));
    //
    // pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ALL_01, {
    //     purity: 'nsfw',
    //     category: 'general',
    //     start: 0,
    //     end: 5000,
    //     limit: 200
    // }));
    //
    //
    // pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ALL_01, {
    //     purity: 'nsfw',
    //     category: 'people',
    //     start: 0,
    //     end: 5000,
    //     limit: 200
    // }));

    pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_QUERY_02, {
        purity: 'nsfw',
        category: 'people',
        apikey: `${getApiKey()}`,
        sinceBegin: new Date("2022-06-01 00:00:00")
    }));

    pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_QUERY_02, {
        purity: 'nsfw',
        category: 'anime',
        apikey: `${getApiKey()}`,
        sinceBegin: new Date("2022-06-01 00:00:00")
    }));

    pool.runTask(new WorkerTaskInfo(TaskKeyId.WH_QUERY_02, {
        purity: 'nsfw',
        category: 'general',
        apikey: `${getApiKey()}`,
        sinceBegin: new Date("2022-06-01 00:00:00")
    }));

    pool.runTask(new WorkerTaskInfo(TaskKeyId.FP_QUERY_01, {
        keyWord:"",
    }));

}
