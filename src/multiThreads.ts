import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';

import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function mainThread() {
    for (let i = 0; i < 3; ++i) {
        const worker = new Worker(__filename, {workerData: i});
        worker.on('exit', code => {
            console.log(`main: worker stopped with exit code ${code}`);
        });
        worker.on('message', msg => {
            console.log(`main: receive ${msg}`);
            worker.postMessage(msg + 1);
        });
    }
}

function workerThead() {
    console.log(`worker: workerDate ${workerData}`);
    parentPort?.on('message', msg => {
        console.log(`worker: receive ${msg}`);
    });
    parentPort?.postMessage(workerData);
}

if (isMainThread) {
    mainThread();
} else {
    workerThead();
}
