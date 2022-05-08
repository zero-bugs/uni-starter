class ResultResp {
    type: string;
    url: string;
    httpCode: number;
    threadId: number;
    
    constructor(type: string, url: string, status: number, threadId: number) {
        this.type = type;
        this.url = url;
        this.httpCode = status;
        this.threadId = threadId;
    }
}
