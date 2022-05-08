import {parentPort, threadId} from "worker_threads";
import {WorkerTaskInfo} from "./WorkPool.js";
import {getRegHandler} from "./EventHandlers.js";

parentPort?.on('message', async (task) => {
    console.log(`begin to handle:${JSON.stringify(task)}`);
    let taskInfo = task as WorkerTaskInfo;
    let res = await getRegHandler(taskInfo.apiId)(taskInfo.data);
    
    parentPort?.postMessage(`task has done, thread-${threadId}, res:${res}`);
});
