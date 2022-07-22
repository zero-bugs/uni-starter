import {ImgEntryPo} from "../@entry/ImgEntryPo.js";
import {pmsClient} from "./Utils.js";
import {ImgDownloadStatus} from "../@entry/ImgDownloadStatus.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import {FpCelebrityDetailEntry} from "../@entry/FpEntryPo.js";


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
                isUsed: ImgDownloadStatus.UN_DOWNLOADED,
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
                isUsed: ImgDownloadStatus.UN_DOWNLOADED,
                createdTime: new Date(entry.created_at),
            }
        });
    } catch (e) {
        printLogSync(LogLevel.INFO, `create new entry failed, error:${e}, entry:${entry}`);
    }

    return true;
}


