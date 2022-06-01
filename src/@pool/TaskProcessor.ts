import {parentPort, threadId} from "worker_threads";
import {WorkerTaskInfo} from "./WorkPool.js";
import {getRegHandler} from "./EventHandlers.js";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";

parentPort?.on('message', async (task) => {
    printLogSync(LogLevel.CONSOLE, `begin to handle:${JSON.stringify(task)}`);
    let taskInfo = task.data as WorkerTaskInfo;
    let res = await getRegHandler(taskInfo.apiId)(taskInfo.data, taskInfo.apiId);

    parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, `task has done, thread-${threadId}, res:${res}`, undefined));
});
