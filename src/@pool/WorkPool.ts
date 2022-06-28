import {AsyncResource} from "async_hooks";
import {EventEmitter} from 'events';
import path, {dirname} from 'path';
import {fileURLToPath} from "url";

import {kWorkerFreedEvent} from "./EventList.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";
import {TaskKeyId} from "../config/ConfigFile.js";
import {UniWorker} from "./UniWorker.js";

const __filename = fileURLToPath(import.meta.url);
const appDirName = dirname(__filename);


export class WorkerTaskInfo extends AsyncResource {
    taskId: string;
    data: any;

    constructor(taskId: string, data: any) {
        super(String(kWorkerFreedEvent));
        this.taskId = taskId;
        this.data = data;
    }
}

export class UniWorkerPool extends EventEmitter {
    poolSize: number;
    maxQueueLen: number;
    workerIdCurrent: number = 0;
    workingList: Array<UniWorker> = [];
    freeList: Array<UniWorker> = [];
    tasks: Array<WorkerTaskInfo> = [];

    constructor(poolSize: number, maxQueueLen: number) {
        super();
        this.poolSize = poolSize;
        this.maxQueueLen = maxQueueLen;
        for (let i = 0; i < poolSize; i++) {
            this.addNewWorker(`${++this.workerIdCurrent}`);
        }

        // 每当发出 kWorkerFreedEvent 时，调度队列中待处理的下一个任务（如果有）
        this.on(kWorkerFreedEvent, () => {
            const taskInfo = this.tasks.shift();
            this.runTask(taskInfo);
        });
    }

    addNewWorker(workId: string) {
        const worker = new UniWorker(workId, path.resolve(appDirName, '../../dist/@pool/TaskProcessor.js'));
        worker.worker.on('message', (result) => {
            if (UniWorkerPool.needGetWorker(result)) {
                printLogSync(LogLevel.INFO, `work pool not matched, message: ${JSON.stringify(result)}`);
                return;
            }
            this.handlePostMsg(result);
        });
        worker.worker.on('error', (err) => {
            printLogSync(LogLevel.ERROR, `work pool result:${JSON.stringify(err)}`);
            this.emit('error', err);
            // 从列表中删除 Worker 并启动一个新的 Worker 来替换当前的 Worker。
            this.workingList.splice(this.workingList.indexOf(worker), 1);
            this.addNewWorker(`${++this.workerIdCurrent}`);
        });
        this.freeList.push(worker);
        this.emit(kWorkerFreedEvent);
    }

    private handlePostMsg(result: PostMsgEventEntry) {
        let postMsg = result as PostMsgEventEntry;
        printLogSync(LogLevel.INFO, `work pool handlePostMsg => id:${postMsg.id}, msg:${postMsg.id}, data:${JSON.stringify(postMsg.data)}`);
        switch (postMsg.id) {
            case PostMsgIdEnum.EVENT_FAIL_RETRY:
                this.runTask(new WorkerTaskInfo(TaskKeyId.WH_DOWNLOAD_ONE_01, postMsg.data));
                break;
            case PostMsgIdEnum.EVENT_NEXT_WORK:
                // 需要恢复worker到freelist中
                this.workingList.every(((value, index, array) => {
                    if (value.id === postMsg.workerId) {
                        printLogSync(LogLevel.INFO, `work pool EVENT_NEXT_WORK => id:${postMsg.id}, hit, data:${JSON.stringify(postMsg.data)}`);
                        this.workingList.splice(index, 1);
                        this.freeList.push(value);
                        this.emit(kWorkerFreedEvent);
                        return true;
                    }
                }))

                // 结束进程
                if (this.workingList.length === 0 && this.tasks.length === 0) {
                    printLogSync(LogLevel.INFO, `work pool is empty, exit process => free workers:${this.freeList.length}, core pool size: ${this.poolSize}, cur workerId:${this.workerIdCurrent}`)
                    this.close();
                }
                break;
            case PostMsgIdEnum.EVENT_NORMAL:
                printLogSync(LogLevel.INFO, `work pool EVENT_NORMAL, task:${JSON.stringify(result)}`);
                break;
            default:
                printLogSync(LogLevel.INFO, `work pool not matched, task:${JSON.stringify(result)}`);
        }

    }

    private static needGetWorker(result: any): boolean {
        if (!result) {
            return false;
        }
        if (!(result instanceof PostMsgEventEntry)) {
            return false;
        }

        let postMsg = result as PostMsgEventEntry;
        return postMsg.id in PostMsgIdEnum;
    }

    runTask(task: WorkerTaskInfo | undefined): boolean {
        if (!task) {
            printLogSync(LogLevel.CONSOLE, "no task have been added.");
            return false;
        }
        // 没有空闲线程，等待工作线程空闲。
        if (this.freeList.length === 0) {
            this.tasks.push(task);
            return false;
        }

        const worker = this.freeList.shift();
        if (worker) {
            this.workingList.push(worker);
        }
        worker?.worker.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, worker.id, '', task));
        return true;
    }

    close() {
        for (const worker of this.workingList) {
            worker.worker.terminate().then(r => {
                printLogSync(LogLevel.CONSOLE, `begin destroy worker..`)
            });
        }
        process.exit(0);
    }
}
