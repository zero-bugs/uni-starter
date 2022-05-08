import {AsyncResource} from "async_hooks";
import {EventEmitter} from 'events';
import path, {dirname} from 'path';
import {Worker} from 'worker_threads';
import {fileURLToPath} from "url";

import {kWorkerFreedEvent} from "./EventList.js";

const __filename = fileURLToPath(import.meta.url);
const appDirName = dirname(__filename);

export class WorkerTaskInfo extends AsyncResource {
    apiId: string;
    data: any;
    
    constructor(apiId: string, data: any) {
        super(String(kWorkerFreedEvent));
        this.apiId = apiId;
        this.data = data;
    }
}

export class WorkerPool extends EventEmitter {
    poolSize: number;
    maxQueueLen: number;
    workingList: Array<Worker> = [];
    freeList: Array<Worker> = [];
    tasks: Array<WorkerTaskInfo> = [];
    
    constructor(poolSize: number, maxQueueLen: number) {
        super();
        this.poolSize = poolSize;
        this.maxQueueLen = maxQueueLen;
        for (let i = 0; i < poolSize; i++) {
            this.addNewWorker();
        }
        
        // 每当发出 kWorkerFreedEvent 时，调度队列中待处理的下一个任务（如果有）
        this.on(kWorkerFreedEvent, () => {
            const taskInfo = this.tasks.shift();
            this.runTask(taskInfo);
        });
    }
    
    addNewWorker() {
        const worker = new Worker(path.resolve(appDirName, '../../dist/@pool/TaskProcessor.js'));
        worker.on('message', (result) => {
            console.log(`work pool result:${result}`);
            this.freeList.push(worker);
            this.workingList.splice(this.workingList.indexOf(worker), 1);
            this.emit(kWorkerFreedEvent);
        });
        worker.on('error', (err) => {
            console.log(`work pool result:${JSON.stringify(err)}`);
            this.emit('error', err);
            // 从列表中删除 Worker 并启动一个新的 Worker 来替换当前的 Worker。
            this.workingList.splice(this.workingList.indexOf(worker), 1);
            this.addNewWorker();
        });
        this.freeList.push(worker);
        this.emit(kWorkerFreedEvent);
    }
    
    runTask(task: WorkerTaskInfo | undefined): boolean {
        if (!task) {
            console.log("no task have been added.");
            return false;
        }
        // 没有空闲线程，等待工作线程空闲。
        if (this.freeList.length === 0) {
            this.tasks.push(task);
            return false;
        }
        
        const worker = this.freeList.pop();
        if (worker) {
            this.workingList.push(worker);
        }
        worker?.postMessage(task);
        return true;
    }
    
    close() {
        for (const worker of this.workingList) worker.terminate();
    }
}
