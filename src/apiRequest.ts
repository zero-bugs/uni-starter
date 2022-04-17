import fetch, {AbortError, RequestInit} from 'node-fetch';
import {parentPort, threadId} from 'worker_threads';

import CustomEvent from "./config/customEvent.js";

import {delay, getLogger, pmsClient} from "./@utils/utils.js";
import {ImgEntryPo, ResImgEntryPo} from './@entry/ImgEntryPo.js'
import {getHttpsProxy} from "./config/proxyConfig.js";
import {randomInt} from "crypto";

let logger4js = getLogger('app')

const maxRetryCount = 3;

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

type QueryParam = {
    purity: String;
    category: string;
    apikey: string;
    sorting: String,
    order: string,
    startPage: number,
    endPage: number,
    sinceBegin: Date, //2022-03-19 00:15:04
    sinceEnd: Date
}

/**
 * create before check exist or not.
 * @param entry
 */
async function pmsCreateWithCheckExist(entry: ImgEntryPo): Promise<boolean> {
    const count = await pmsClient.image.count({
        where: {
            imgId: entry.id,
        }
    });

    if (count !== 0) {
        return false;
    }

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
            createdTime: new Date(entry.created_at),
        }
    });
    return true;
}

async function fetchWithRetry(pageUrlLink: string, options: RequestInit, queryParam: QueryParam) {
    let respJson: ResImgEntryPo;
    let imagePoList = new Array<ImgEntryPo>();

    let retry = 0;
    while (retry < maxRetryCount) {
        try {
            const response = await fetch(pageUrlLink, options)

            if (response.status !== 200 && response.status !== 201) {
                parentPort?.postMessage(new ResultResp(CustomEvent.CLIENT_ERR, pageUrlLink,
                    response.status, threadId));
                logger4js.warn(`worker threadId-${threadId} execute failed request url:${pageUrlLink}`);
                ++retry;
                continue;
            }

            parentPort?.postMessage(new ResultResp(CustomEvent.CLIENT_RES, pageUrlLink,
                response.status, threadId));

            const data = await response.json();
            respJson = data as ResImgEntryPo;
            if (queryParam.endPage > respJson.meta.last_page) {
                queryParam.endPage = respJson.meta.last_page;
            }

            respJson.data.forEach(entry => {
                // po->vo
                let respImgPo = entry as ImgEntryPo;
                imagePoList.push(respImgPo);
            });
            retry = maxRetryCount;
        } catch (error) {
            if (error instanceof AbortError) {
                logger4js.warn(`'worker thread-${threadId} execute AbortError with request url:${pageUrlLink}`);
            } else {
                logger4js.warn(`'worker thread-${threadId} execute unknown error with request url:${pageUrlLink}`);
                console.trace();
            }
            logger4js.error(`${threadId} http failed, retry:${retry}, error msg:${error}`);

            ++retry;
            await delay(randomInt(3000, 6000));
        }
    }
    return imagePoList;
}

/**
 * wh: default search
 * @param endpoint
 * @param queryParam
 */
export async function whSearchListDefault(endpoint: string, queryParam: QueryParam) {
    let page = queryParam.startPage === 0 ? 1 : queryParam.startPage;
    if (queryParam.sinceBegin == null) {
        queryParam.sinceBegin = new Date("1970-01-01 00:00:00");
    }
    if (queryParam.sinceEnd == null) {
        queryParam.sinceEnd = new Date();
    }

    let urlLink = `${endpoint}?purity=${queryParam.purity}&category=${queryParam.category}&sorting=${queryParam.sorting}&order=${queryParam.order}&apikey=${queryParam.apikey}`
    while (page < queryParam.endPage) {
        let pageUrlLink = `${urlLink}&page=${page}`
        page += 1;

        let options: RequestInit = {};
        let proxy = getHttpsProxy();
        if (proxy) {
            options.agent = getHttpsProxy();
        }

        let imagePoList: Array<ImgEntryPo> = await fetchWithRetry(pageUrlLink, options, queryParam);
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
            logger4js.info(`threadId-${threadId}, images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd} have handled, break...`);
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

        logger4js.info(`threadId-${threadId},images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd}, add ${writeDbCount}, cur ${page}`);

        await delay(randomInt(3000, 6000));
    }
}
