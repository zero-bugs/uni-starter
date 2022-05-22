type DownloadEntryPo = {
    category: string;
    purity: string;
    start: number,
    end: number,
    limit: number,
    sinceBegin: Date, //2022-03-19 00:15:04
    sinceEnd: Date
}


type DownloadParams = {
    category: string;
    purity: string;
    imgId: string;
    rootPath: string;
    url: string;
    extName: string;
}