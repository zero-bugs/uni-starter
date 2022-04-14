import fetch, {RequestInit} from 'node-fetch';
import {parentPort, threadId} from 'worker_threads';

import CustomEvent from "./config/customEvent.js";

import {delay, getLogger, pmsClient} from "./@utils/utils.js";
import {ImgEntryPo, ResImgEntryPo} from './@entry/ImgEntryPo.js'
import {getHttpsProxy} from "./config/proxyConfig.js";
import {randomInt} from "crypto";

let logger4js = getLogger('app')

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
    sorting: String,
    order: string,
    startPage: number,
    endPage: number,
    sinceBegin: Date, //2022-03-19 00:15:04
    sinceEnd: Date
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

    let urlLink = `${endpoint}?purity=${queryParam.purity}&sorting=${queryParam.sorting}&order=${queryParam.order}`
    while (page < queryParam.endPage) {
        let pageUrlLink = `${urlLink}&page=${page}`
        page += 1;

        let options: RequestInit = {};
        let proxy = getHttpsProxy();
        if (proxy) {
            options.agent = getHttpsProxy();
        }

        let respJson: ResImgEntryPo;
        let imagePoList = new Array<ImgEntryPo>();
        await fetch(pageUrlLink, options).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                parentPort?.postMessage(new ResultResp(CustomEvent.CLIENT_ERR, pageUrlLink,
                    res.status, threadId));
                logger4js.warn('worker execute failed request url:%s', endpoint)
                throw new Error(`http error:${res.status}, ${res.body}`);
            }
            parentPort?.postMessage(new ResultResp(CustomEvent.CLIENT_RES, pageUrlLink,
                res.status, threadId));
            return res.json();
        }).then((res) => {
            respJson = res as ResImgEntryPo;

            if (queryParam.endPage > respJson.meta.last_page) {
                queryParam.endPage = respJson.meta.last_page;
            }

            respJson.data.forEach(entry => {
                // po->vo
                let respImgPo = entry as ImgEntryPo;
                imagePoList.push(respImgPo);
            });
        }).catch(e => {
            logger4js.warn("http request error for url:%s", pageUrlLink, e);
        });

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
        if (validImgCount === 0) {
            logger4js.info(`images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd} have handled, break...`);
            break;
        }


        // write to db
        let totalCount = imagePoList.length;
        let writeDbCount = 0;
        for (const entry of imagePoList) {
            // check exist or not
            const count = pmsClient.image.count({
                where: {
                    imgId: entry.id,
                },
                select: {
                    imgId: true,
                }
            });

            await console.log(count);
            
            pmsClient.image.create({
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
        }

        logger4js.info("");

        await delay(randomInt(3000, 6000));
    }
}
