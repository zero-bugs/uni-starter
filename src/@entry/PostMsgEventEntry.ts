export class PostMsgEventEntry {
    id: PostMsgIdEnum;
    msg: string;
    data: any;

    constructor(id: PostMsgIdEnum, msg: string, data: any) {
        this.id = id;
        this.msg = msg;
        this.data = data;
    }
}

export enum PostMsgIdEnum {
    EVENT_NORMAL,
    EVENT_FAIL_RETRY,
}