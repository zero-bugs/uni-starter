import fetch, {AbortError, RequestInit} from "node-fetch";
import {randomInt} from "crypto";
import {parentPort, threadId} from "worker_threads";

import {ImgEntryPo, ResImgEntryPo} from "../@entry/ImgEntryPo.js";
import {delay} from "./Utils.js";
import {appendLogSyncAppLog, formatMsg} from "../@log/Log4js.js";

const maxRetryCount = 3;

export async function fetchWithRetry(pageUrlLink: string, options: RequestInit, queryParam: QueryParam) {
    let respJson: ResImgEntryPo;
    let imagePoList = new Array<ImgEntryPo>();

    let retry = 0;
    while (retry < maxRetryCount) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 30000);
        options.signal = controller.signal;

        try {
            const response = await fetch(pageUrlLink, options)
            if (response.status !== 200 && response.status !== 201) {
                appendLogSyncAppLog(formatMsg(`worker execute failed request url:${pageUrlLink}, response:${response.status}, ${await response.text()}`));
                ++retry;
                continue;
            }

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
            parentPort?.postMessage(`threadId-${threadId}, url:${pageUrlLink} failed. msg:${error}`);
            if (error instanceof AbortError) {
                appendLogSyncAppLog(formatMsg(`worker execute AbortError with request url:${pageUrlLink}`));
            } else {
                appendLogSyncAppLog(formatMsg(`worker execute unknown error with request url:${pageUrlLink}`));
                console.trace();
            }
            appendLogSyncAppLog(formatMsg(`http failed, retry:${retry}, error msg:${error}`));

            ++retry;
            await delay(randomInt(3000, 6000));
        } finally {
            clearTimeout(timeout);
        }
    }
    return imagePoList;
}

