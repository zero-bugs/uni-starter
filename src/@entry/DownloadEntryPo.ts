export type DownloadEntryPo = {
    category: string;
    purity: string;
    start: number;
    end: number;
    limit: number;
    sinceBegin: Date; //2022-03-19 00:15:04
    sinceEnd: Date;
}


export type DownloadParams = {
    category: string;
    purity: string;
    imgId: string;
    createTime: Date;
    sinceBegin: Date; //2022-03-19 00:15:04
    sinceEnd: Date;
    rootPath: string;
    url: string;
    extName: string;
    isUsed: number | null;
}