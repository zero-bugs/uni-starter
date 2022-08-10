export class PostMsgEventEntry {
    id: PostMsgIdEnum;
    workerId: string;
    msg: string;
    data: any;

    constructor(id: PostMsgIdEnum, workerId: string, msg: string, data: any) {
        this.id = id;
        this.workerId = workerId;
        this.msg = msg;
        this.data = data;
    }
}

export enum PostMsgIdEnum {
    EVENT_NORMAL,
    EVENT_FAIL_RETRY,
    EVENT_NEXT_WORK,
}