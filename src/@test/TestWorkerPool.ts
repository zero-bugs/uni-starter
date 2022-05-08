import {WorkerPool, WorkerTaskInfo} from "../@pool/WorkPool.js";
import {intLog4j} from "../@log/Log4js.js";

intLog4j()

const pool = new WorkerPool(10, 100);
for (let i = 0; i < 2; i++) {
    pool.runTask(new WorkerTaskInfo('001', {a: 42, b: 100}));
}
