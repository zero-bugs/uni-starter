export type FpEntry = {
    name: string;
    url: string;
}

export type FpCelebrityListEntry = {
    postId: string;
    name: string;
    title: string;
    url: string;
    summary: string;
    createdTime: Date;
}

export type FpCelebrityDetailEntry = {
    postId: string;
    name: string;
    title: string;
    url: string | undefined | null;
    urlType: string;
    summary: string | null;
    detail: string | null;
    createdTime: Date;
}

export enum UrlType {
    IMG = "img",
    VIDEO = "vdo",
    TEXT = "txt",
}
