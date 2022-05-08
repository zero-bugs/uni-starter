import {RequestInit} from "node-fetch";
import {randomInt} from "crypto";

import {getHttpsProxy} from "../config/ProxyConfig.js";
import {ImgEntryPo} from "../@entry/ImgEntryPo.js";
import {formatMsg, getLog4js} from "../@log/Log4js.js";
import {delay} from "../@utils/Utils.js";

import {fetchWithRetry} from "../@utils/HttpUtils.js";
import {pmsCreateWithCheckExist} from "../@utils/PsDbUtils.js";

const logger4js = getLog4js('WhApiHandler');

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
            logger4js.info(formatMsg(`images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd} have handled, break...`));
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
        
        logger4js.info(formatMsg(`images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd}, add ${writeDbCount}, cur ${page}`));
        
        await delay(randomInt(3000, 6000));
    }
    
    process.exit(0);
}