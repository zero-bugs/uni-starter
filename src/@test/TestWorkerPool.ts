import {UniWorkerPool, WorkerTaskInfo} from "../@pool/WorkPool.js";

const pool = new UniWorkerPool(10, 100);
for (let i = 0; i < 2; i++) {
    pool.runTask(new WorkerTaskInfo('001', {a: 42, b: 100}));
}
