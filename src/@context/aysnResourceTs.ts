import {AsyncResource} from "async_hooks";

class DBQuery extends AsyncResource {
    db: any;

    constructor(db: any) {
        super('DBQuery');
        this.db = db;
    }

    getInfo(query: string, callback: any) {
        this.db.get(query, (err: any, data: any) => {
            this.runInAsyncScope(callback, null, err, data);
        });
    }

    close() {
        this.db = null;
        this.emitDestroy();
    }
}
