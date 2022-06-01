import fetch, {AbortError, RequestInit} from "node-fetch";
import {randomInt} from "crypto";
import {parentPort, threadId} from "worker_threads";

import {ImgEntryPo, ResImgEntryPo} from "../@entry/ImgEntryPo.js";
import {delay, pmsClient} from "./Utils.js";
import {formatMsg, LogLevel, printLogSync} from "../@log/Log4js.js";
import * as fs from "fs";
import {getHttpsProxy} from "../config/ProxyConfig.js";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";

const maxRetryCount = 3;

export async function fetchWithRetry(options: RequestInit, pageUrlLink: string, queryParam: QueryParam) {
    let proxy = getHttpsProxy();
    if (proxy) {
        options.agent = getHttpsProxy();
    }

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
                printLogSync(0, formatMsg(`worker execute failed request url:${pageUrlLink}, response:${response.status}, ${await response.text()}`));
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
            parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, `threadId-${threadId}, url:${pageUrlLink} failed. msg:${error}`, undefined));
            if (error instanceof AbortError) {
                printLogSync(0, formatMsg(`worker execute AbortError with request url:${pageUrlLink}`));
            } else {
                printLogSync(0, formatMsg(`worker execute unknown error with request url:${pageUrlLink}`));
                console.trace();
            }
            printLogSync(0, formatMsg(`http failed, retry:${retry}, error msg:${error}`));

            ++retry;
            await delay(randomInt(3000, 6000));
        } finally {
            clearTimeout(timeout);
        }
    }
    return imagePoList;
}

export async function fetchImgWithRetry(options: RequestInit, param: DownloadParams) {
    if (param.isUsed === 1) {
        return;
    }

    let proxy = getHttpsProxy();
    if (proxy) {
        options.agent = getHttpsProxy();
    }

    let dldPath = `${param.rootPath}/${param.category}/${param.purity}`
    if (!fs.existsSync(dldPath)) {
        fs.mkdirSync(dldPath, {recursive: true});
    }

    let imgName = `${dldPath}/${param.imgId}.${param.extName}`;
    if (fs.existsSync(imgName)) {
        await pmsClient.image.update({
            where: {imgId: param.imgId},
            data: {
                isUsed: 1
            }
        });
        return;
    }

    let retry = 0;
    while (retry < maxRetryCount) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 300000);
        options.signal = controller.signal;

        try {
            printLogSync(0, formatMsg(`begin to download img:${param.imgId}.${param.extName}, url:${param.url}`));
            const response = await fetch(param.url, options);
            if (response.status === 404) {
                printLogSync(0, formatMsg(`image not exist, url:${param.url}, response:${response.status}, ${await response.text()}`));
                break;
            }
            if (response.status !== 200 && response.status !== 201) {
                printLogSync(0, formatMsg(`worker execute download failed url:${param.url}, response:${response.status}, ${await response.text()}`));
                ++retry;
                continue;
            }

            printLogSync(0, formatMsg(`begin to write img:${param.imgId}.${param.extName}`));
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            fs.writeFile(imgName, buffer, () => {
                parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, `img download failed. ${JSON.stringify(param)}`, undefined))
                printLogSync(LogLevel.CONSOLE, `finished downloading, ${imgName}`);
            });
            break;
        } catch (error) {
            parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, `threadId-${threadId}, url:${param.url} failed. msg:${error}`, undefined));
            if (error instanceof AbortError) {
                printLogSync(0, formatMsg(`worker execute AbortError with request url:${param.url}`));
            } else {
                printLogSync(0, formatMsg(`worker execute unknown error with request url:${param.url}`));
                console.trace();
            }
            printLogSync(0, formatMsg(`http failed, retry:${retry}, error msg:${error}`));

            ++retry;
            if (retry == maxRetryCount) {
                parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_FAIL_RETRY, `img need download again.`, param))
            }
            await delay(randomInt(3000, 6000));
        } finally {
            clearTimeout(timeout);
        }
    }
}