import {ImgEntryPo} from "../@entry/ImgEntryPo.js";
import {pmsClient} from "./Utils.js";
import {IsUsedStatus} from "../@entry/IsUsedStatus.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import {FpCelebrityDetailEntry, UrlType} from "../@entry/FpEntryPo.js";
import {ArticleTbl, FappeningTbl} from "@prisma/client";


export async function updateArticleUsed(id: number) {
    return pmsClient.articleTbl.update({
        where: {
            id: id
        },
        data: {
            isUsed: IsUsedStatus.USED,
        }
    });
}

export async function fpGetPictureList() {
    const entryList: FappeningTbl[] = [];
    const entry = await pmsClient.fappeningTbl.findFirst({
            take: 1,
            where: {
                isUsed: IsUsedStatus.UN_USED,
                AND: [
                    {
                        urlType: {
                            in: [UrlType.IMG, UrlType.VIDEO]
                        }
                    }
                ]
            },
            orderBy: {
                createAt: 'asc',
            }
        }
    );
    if (entry === null || entry === undefined) {
        return entryList;
    }

    entryList.push(entry);

    let tempEntryList: FappeningTbl[] = [];
    tempEntryList.push(entry);
    let cursorId = entry.id;
    while (true) {
        tempEntryList = await pmsClient.fappeningTbl.findMany({
                take: 5000,
                skip: 1,
                cursor: {
                    id: cursorId,
                },
                where: {
                    isUsed: IsUsedStatus.UN_USED,
                    AND: [
                        {
                            urlType: {
                                in: [UrlType.IMG, UrlType.VIDEO]
                            }
                        }
                    ]
                },
                orderBy: {
                    createAt: 'asc',
                }
            }
        );

        if (tempEntryList === null || tempEntryList.length === 0) {
            break;
        }

        tempEntryList.forEach(value => entryList.push(value));
        cursorId = tempEntryList[tempEntryList.length - 1].id;

        printLogSync(LogLevel.CONSOLE, `loading image: next cursor:${cursorId}`);
    }
    printLogSync(LogLevel.CONSOLE, `load db completed...`)
    return entryList;
}

export async function fpGetArticleList() {
    const entryList: ArticleTbl[] = [];
    const entry = await pmsClient.articleTbl.findFirst({
            take: 1,
            where: {
                isUsed: IsUsedStatus.UN_USED,
            },
            orderBy: {
                createAt: 'asc',
            }
        }
    );
    if (entry === null || entry === undefined) {
        return entryList;
    }

    entryList.push(entry);

    let tempEntryList: ArticleTbl[] = [];
    tempEntryList.push(entry);
    let cursorId = entry.id;
    while (true) {
        tempEntryList = await pmsClient.articleTbl.findMany({
                take: 2000,
                skip: 1,
                cursor: {
                    id: cursorId,
                },
                where: {
                    isUsed: IsUsedStatus.UN_USED,
                },
                orderBy: {
                    createAt: 'asc',
                }
            }
        );

        if (tempEntryList === null || tempEntryList.length === 0) {
            break;
        }

        tempEntryList.forEach(value => entryList.push(value));
        cursorId = tempEntryList[tempEntryList.length - 1].id;
    }
    return entryList;
}


export async function fpCheckFpTblExist(postId: string) {
    return pmsClient.fappeningTbl.findFirst({
        take: 1,
        where: {
            AND: [
                {postId: postId},
                {isUsed: IsUsedStatus.UN_USED}
            ]
        }
    });
}


export async function fpCheckArticleExist(postId: string) {
    return pmsClient.articleTbl.findFirst({
        take: 1,
        where: {
            AND: [
                {postId: postId},
                {isUsed: IsUsedStatus.UN_USED}
            ]
        }
    });
}

export async function fpCreateWithCheckArticleExist(fpEntry: FpCelebrityDetailEntry): Promise<boolean> {
    const count = await pmsClient.articleTbl.count({
        where: {
            AND: [
                {postId: fpEntry.postId},
                {url: fpEntry.url}
            ]
        }
    });

    if (count !== 0) {
        return false;
    }

    try {
        await pmsClient.articleTbl.create({
            data: {
                postId: fpEntry.postId,
                name: fpEntry.name,
                title: fpEntry.title,
                url: fpEntry.url,
                urlType: fpEntry.urlType,
                summary: fpEntry.summary,
                detail: fpEntry.detail,
                isUsed: IsUsedStatus.UN_USED,
                createdTime: new Date(fpEntry.createdTime)
            }
        });
    } catch (e) {
        printLogSync(LogLevel.INFO, `create new article entry failed, error:${e}, entry:${fpEntry}`);
    }

    return true;
}


export async function fpCreateWithCheckExist(fpEntry: FpCelebrityDetailEntry): Promise<boolean> {
    const count = await pmsClient.fappeningTbl.count({
        where: {
            postId: fpEntry.postId,
            url: fpEntry.url,
        }
    });

    if (count !== 0) {
        return false;
    }

    try {
        await pmsClient.fappeningTbl.create({
            data: {
                postId: fpEntry.postId,
                name: fpEntry.name,
                title: fpEntry.title,
                url: fpEntry.url,
                urlType: fpEntry.urlType,
                summary: fpEntry.summary,
                detail: fpEntry.detail,
                isUsed: IsUsedStatus.UN_USED,
                createdTime: new Date(fpEntry.createdTime)
            }
        });
    } catch (e) {
        printLogSync(LogLevel.INFO, `create new entry failed, error:${e}, entry:${fpEntry}`);
    }

    return true;
}

/**
 * create before check exist or not.
 * @param entry
 */
export async function pmsCreateWithCheckExist(entry: ImgEntryPo): Promise<boolean> {
    const count = await pmsClient.image.count({
        where: {
            imgId: entry.id,
        }
    });

    if (count !== 0) {
        return false;
    }

    try {
        await pmsClient.image.create({
            data: {
                imgId: entry.id,
                fileType: entry.file_type,
                fileSize: entry.file_size,
                dimensionX: entry.dimension_x,
                dimensionY: entry.dimension_y,
                purity: entry.purity,
                category: entry.category,
                path: entry.path,
                url: entry.url,
                source: entry.source,
                views: entry.views,
                favorites: entry.favorites,
                ratio: entry.ratio,
                isUsed: IsUsedStatus.UN_USED,
                createdTime: new Date(entry.created_at),
            }
        });
    } catch (e) {
        printLogSync(LogLevel.INFO, `create new entry failed, error:${e}, entry:${entry}`);
    }

    return true;
}


