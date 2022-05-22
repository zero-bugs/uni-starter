import fetch, {AbortError, RequestInit} from "node-fetch";
import {randomInt} from "crypto";
import {parentPort, threadId} from "worker_threads";

import {ImgEntryPo, ResImgEntryPo} from "../@entry/ImgEntryPo.js";
import {delay} from "./Utils.js";
import {appendLogSyncAppLog, formatMsg} from "../@log/Log4js.js";
import * as fs from "fs";
import {getHttpsProxy} from "../config/ProxyConfig.js";

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

export async function fetchImgWithRetry(options: RequestInit, param: DownloadParams) {
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
            appendLogSyncAppLog(formatMsg(`begin to download img:${param.imgId}.${param.extName}, url:${param.url}`));
            const response = await fetch(param.url, options);
            if (response.status !== 200 && response.status !== 201) {
                appendLogSyncAppLog(formatMsg(`worker execute download failed url:${param.url}, response:${response.status}, ${await response.text()}`));
                ++retry;
                continue;
            }

            appendLogSyncAppLog(formatMsg(`begin to write img:${param.imgId}.${param.extName}`));
            // await response.body?.pipe(await fs.createWriteStream(`${dldPath}/${param.id}.${param.extName}`));
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            // fs.createWriteStream(`${dldPath}/${param.id}.${param.extName}`).write(buffer);

            fs.writeFile(imgName, buffer, () => {
                parentPort?.postMessage(`img download failed. ${JSON.stringify(param)}`)
                console.log(`finished downloading, ${imgName}`);
            });

            retry = maxRetryCount;
        } catch (error) {
            parentPort?.postMessage(`threadId-${threadId}, url:${param.url} failed. msg:${error}`);
            if (error instanceof AbortError) {
                appendLogSyncAppLog(formatMsg(`worker execute AbortError with request url:${param.url}`));
            } else {
                appendLogSyncAppLog(formatMsg(`worker execute unknown error with request url:${param.url}`));
                console.trace();
            }
            appendLogSyncAppLog(formatMsg(`http failed, retry:${retry}, error msg:${error}`));

            ++retry;
            await delay(randomInt(3000, 6000));
        } finally {
            clearTimeout(timeout);
        }
    }
}