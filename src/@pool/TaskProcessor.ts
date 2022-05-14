import {parentPort, threadId} from "worker_threads";
import {WorkerTaskInfo} from "./WorkPool.js";
import {getRegHandler} from "./EventHandlers.js";
import {ApiKeyId} from "../config/ConfigFile.js";

parentPort?.on('message', async (task) => {
    console.log(`begin to handle:${JSON.stringify(task)}`);
    let taskInfo = task as WorkerTaskInfo;
    let res = await getRegHandler(taskInfo.apiId)(taskInfo.data, ApiKeyId.WH_QUERY_01);

    parentPort?.postMessage(`task has done, thread-${threadId}, res:${res}`);
});
