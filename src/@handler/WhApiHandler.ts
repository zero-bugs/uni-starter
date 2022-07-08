import {RequestInit} from "node-fetch";
import {randomInt} from "crypto";
import {parentPort, threadId} from "worker_threads";

import {ImgEntryPo} from "../@entry/ImgEntryPo.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import {delay, getExtName} from "../@utils/Utils.js";

import {fetchWithRetry} from "../@utils/HttpUtils.js";
import {pmsCreateWithCheckExist} from "../@utils/PsDbUtils.js";
import {getApiEndpoint, getFetchType, getPicOutputPath} from "../config/ConfigFile.js";

import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";
import {downloadSingleImage} from "./dwlImgsHandler.js";
import {ImgDownloadStatus} from "../@entry/ImgDownloadStatus.js";


export async function whSearchListLatest(queryParam: QueryParam) {
    if (queryParam.sinceBegin == null) {
        queryParam.sinceBegin = new Date("2022-01-01 00:00:00");
    }
    if (queryParam.sinceEnd == null) {
        queryParam.sinceEnd = new Date();
    }

    let endpoint = getApiEndpoint(queryParam.apiId);
    let urlLink = `${endpoint}?purity=${queryParam.purity}&category=${queryParam.category}&sorting=date_added&order=desc&apikey=${queryParam.apikey}`
    let page = 0;
    while (page < 2000) {
        ++page;
        let pageUrlLink = `${urlLink}&page=${page}`

        let options: RequestInit = {};
        let imagePoList: Array<ImgEntryPo> = await fetchWithRetry(options, pageUrlLink, queryParam);
        if (imagePoList.length === 0) {
            continue;
        }

        let validImgCount = 0;
        // check date if between sinceBegin and sinceEnd.
        let imgDate: Date;
        imagePoList.forEach(entry => {
            imgDate = new Date(entry.created_at);
            if (imgDate.getMilliseconds() >= queryParam.sinceBegin.getMilliseconds()
                && imgDate.getMilliseconds() < queryParam.sinceEnd.getMilliseconds()) {
                ++validImgCount;
            }
        })
        if (validImgCount === 0 || imagePoList.length === 0) {
            printLogSync(LogLevel.INFO, `images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd} have handled, break...`);
            break;
        }

        // write to db
        for (const entry of imagePoList) {
            // check exist or not
            if (await pmsCreateWithCheckExist(entry)) {
                await downloadSingleImage({
                    category: queryParam.category,
                    purity: queryParam.purity,
                    imgId: entry.id,
                    createTime: new Date(entry.created_at),
                    sinceBegin: queryParam.sinceBegin,//2022-03-19 00:15:04
                    sinceEnd: queryParam.sinceEnd,
                    rootPath: `${getPicOutputPath()}/${getFetchType()}`,
                    url: entry.path,
                    extName: getExtName(entry.file_type),
                    isUsed: ImgDownloadStatus.UN_DOWNLOADED,
                });
            }

            await delay(randomInt(1000, 3000));
        }
    }
}


/**
 * wh: default search
 * @param queryParam 查询参数
 * @param apiId apiId
 * @param queryParam
 */
export async function whSearchListDefault(queryParam: QueryParam) {
    let page = queryParam.startPage === 0 ? 1 : queryParam.startPage;
    if (queryParam.sinceBegin == null) {
        queryParam.sinceBegin = new Date("1970-01-01 00:00:00");
    }
    if (queryParam.sinceEnd == null) {
        queryParam.sinceEnd = new Date();
    }

    let endpoint = getApiEndpoint(queryParam.apiId);
    let urlLink = `${endpoint}?purity=${queryParam.purity}&category=${queryParam.category}&sorting=${queryParam.sorting}&order=${queryParam.order}&apikey=${queryParam.apikey}`
    while (page <= queryParam.endPage) {
        let pageUrlLink = `${urlLink}&page=${page}`
        page += 1;

        let options: RequestInit = {};
        let imagePoList: Array<ImgEntryPo> = await fetchWithRetry(options, pageUrlLink, queryParam);
        if (imagePoList.length === 0) {
            continue;
        }

        let validImgCount = 0;
        // check date if between sinceBegin and sinceEnd.
        let imgDate: Date;
        imagePoList.forEach(entry => {
            imgDate = new Date(entry.created_at);
            if (imgDate.getMilliseconds() >= queryParam.sinceBegin.getMilliseconds()
                && imgDate.getMilliseconds() < queryParam.sinceEnd.getMilliseconds()) {
                ++validImgCount;
            }
        })
        if (validImgCount === 0 || imagePoList.length === 0) {
            printLogSync(LogLevel.INFO, `images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd} have handled, break...`);
            break;
        }

        // write to db
        let writeDbCount = 0;
        for (const entry of imagePoList) {
            // check exist or not
            if (await pmsCreateWithCheckExist(entry)) {
                ++writeDbCount;
            }
        }

        parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, '0', `threadId-${threadId}, url:${pageUrlLink} success`, undefined));

        printLogSync(LogLevel.INFO, `images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd}, add ${writeDbCount}, cur ${page}`);

        await delay(randomInt(3000, 6000));
    }
}
