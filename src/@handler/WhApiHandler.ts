import {RequestInit} from "node-fetch";
import {randomInt} from "crypto";

import {ImgEntryPo} from "../@entry/ImgEntryPo.js";
import {printLogSync, formatMsg} from "../@log/Log4js.js";
import {delay} from "../@utils/Utils.js";

import {fetchWithRetry} from "../@utils/HttpUtils.js";
import {pmsCreateWithCheckExist} from "../@utils/PsDbUtils.js";
import {getApiEndpoint} from "../config/ConfigFile.js";
import {parentPort, threadId} from "worker_threads";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";


/**
 * wh: default search
 * @param queryParam 查询参数
 * @param apiId apiId
 * @param queryParam
 */
export async function whSearchListDefault(queryParam: QueryParam, apiId: string) {
    let page = queryParam.startPage === 0 ? 1 : queryParam.startPage;
    if (queryParam.sinceBegin == null) {
        queryParam.sinceBegin = new Date("1970-01-01 00:00:00");
    }
    if (queryParam.sinceEnd == null) {
        queryParam.sinceEnd = new Date();
    }

    let endpoint = getApiEndpoint(apiId);
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
            printLogSync(0, formatMsg(`images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd} have handled, break...`));
            continue;
        }

        // write to db
        let writeDbCount = 0;
        for (const entry of imagePoList) {
            // check exist or not
            if (await pmsCreateWithCheckExist(entry)) {
                ++writeDbCount;
            }
        }

        parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, `threadId-${threadId}, url:${pageUrlLink} success`, undefined));

        printLogSync(0, formatMsg(`images created between ${queryParam.sinceBegin} and ${queryParam.sinceEnd}, add ${writeDbCount}, cur ${page}`));

        // await delay(randomInt(3000, 6000));
    }

    process.exit(0);
}
