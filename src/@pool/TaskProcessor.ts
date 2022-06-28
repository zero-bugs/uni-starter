import {parentPort, threadId} from "worker_threads";
import {WorkerTaskInfo} from "./WorkPool.js";
import {getRegHandler} from "./EventHandlers.js";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";

parentPort?.on('message', async (task) => {
    printLogSync(LogLevel.CONSOLE, `begin to handle:${JSON.stringify(task)}`);
    let msgEventTask = task as PostMsgEventEntry;
    let taskInfo = msgEventTask.data as WorkerTaskInfo;
    let handler = getRegHandler(taskInfo.taskId);
    if (!handler) {
        printLogSync(LogLevel.CONSOLE, `task:${JSON.stringify(task)} has no handle corresponding...`);
        parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NEXT_WORK, msgEventTask.workerId, `need executed next task, thread-${threadId}`, undefined));
        return;
    }

    let res = await handler(taskInfo.data);
    parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NEXT_WORK, msgEventTask.workerId, `task has done, thread-${threadId}, res:${res}`, undefined));
});
