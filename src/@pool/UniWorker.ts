import {URL} from "node:url";
import {Worker, WorkerOptions} from 'worker_threads';

/**
 * wrapper new worker
 */
export class UniWorker {
    id: string;
    worker: Worker;

    constructor(id: string, filename: string | URL, options?: WorkerOptions) {
        this.id = id;
        this.worker = new Worker(filename, options);
    }
}