import fetch, {AbortError, RequestInit} from "node-fetch";
import {randomInt} from "crypto";
import {parentPort, threadId} from "worker_threads";

import {ImgEntryPo, ResImgEntryPo} from "../@entry/ImgEntryPo.js";
import {delay, pmsClient} from "./Utils.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import * as fs from "fs";
import {getHttpsProxy} from "../config/ProxyConfig.js";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";
import {ImgDownloadStatus} from "../@entry/ImgDownloadStatus.js";

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
                printLogSync(LogLevel.INFO, `worker execute failed request url:${pageUrlLink}, response:${response.status}, ${await response.text()}`);
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
                printLogSync(LogLevel.ERROR, `worker execute AbortError with request url:${pageUrlLink}`);
            } else {
                printLogSync(LogLevel.ERROR, `worker execute unknown error with request url:${pageUrlLink}`);
                console.trace();
            }
            printLogSync(LogLevel.ERROR, `http failed, retry:${retry}, error msg:${error}`);

            ++retry;
            await delay(randomInt(3000, 6000));
        } finally {
            clearTimeout(timeout);
        }
    }
    return imagePoList;
}

function getNormalizeMonth(param: DownloadParams) {
    let month = param.createTime.getMonth() + 1;
    let monthDirName = `${month}`
    if (month > 0 && month < 10) {
        monthDirName = `0${month}`;
    }
    return monthDirName;
}

export async function fetchImgWithRetry(options: RequestInit, param: DownloadParams) {
    // 判断是否下载过
    if (param.isUsed !== ImgDownloadStatus.UN_DOWNLOADED) {
        return false;
    }

    // 判断时间
    if (param.createTime.getMilliseconds() < param.sinceBegin.getMilliseconds()
        || param.createTime.getMilliseconds() > param.sinceEnd.getMilliseconds()) {
        return false;
    }

    let proxy = getHttpsProxy();
    if (proxy) {
        options.agent = getHttpsProxy();
    }

    // 目录考虑时间，判断目录是否存在
    let dldPath = `${param.rootPath}/${param.category}/${param.purity}/${param.createTime.getFullYear()}-${getNormalizeMonth(param)}`
    if (!fs.existsSync(dldPath)) {
        fs.mkdirSync(dldPath, {recursive: true});
    }

    // 判断文件是否存在
    let imgName = `${dldPath}/${param.imgId}.${param.extName}`;
    if (fs.existsSync(imgName)) {
        await pmsClient.image.update({
            where: {imgId: param.imgId},
            data: {
                isUsed: ImgDownloadStatus.DOWNLOADED,
            }
        });
        return false;
    }

    let retry = 0;
    while (retry < maxRetryCount) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 300000);
        options.signal = controller.signal;

        try {
            printLogSync(LogLevel.INFO, `begin to download img:${param.imgId}.${param.extName}, url:${param.url}`);
            const response = await fetch(param.url, options);
            if (response.status === 404) {
                await pmsClient.image.update({
                    where: {imgId: param.imgId},
                    data: {
                        isUsed: ImgDownloadStatus.NOT_EXIST,
                    }
                });

                printLogSync(LogLevel.INFO, `image not exist, url:${param.url}, response:${response.status}, ${await response.text()}`);
                break;
            }
            if (response.status !== 200 && response.status !== 201) {
                printLogSync(LogLevel.INFO, `worker execute download failed url:${param.url}, response:${response.status}, ${await response.text()}`);
                ++retry;
                continue;
            }

            printLogSync(LogLevel.INFO, `begin to write img:${param.imgId}.${param.extName}`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            fs.appendFile(imgName, buffer, (err) => {
                if (err) {
                    parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_FAIL_RETRY, `img need download again.`, param));
                    printLogSync(LogLevel.CONSOLE, `image:${imgName} write local failed, err:${err}`);
                } else {
                    printLogSync(LogLevel.CONSOLE, `image:${imgName} write local success`);
                }
            });

            await pmsClient.image.update({
                where: {imgId: param.imgId},
                data: {
                    isUsed: ImgDownloadStatus.DOWNLOADED,
                }
            });

            break;
        } catch (error) {
            parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_FAIL_RETRY, `threadId-${threadId}, url:${param.url} failed. msg:${error}`, undefined));
            if (error instanceof AbortError) {
                printLogSync(LogLevel.ERROR, `worker execute AbortError with request url:${param.url}`);
            } else {
                printLogSync(LogLevel.ERROR, `worker execute unknown error with request url:${param.url}`);
                console.trace();
            }
            printLogSync(LogLevel.ERROR, `http failed, retry:${retry}, error msg:${error}`);

            ++retry;
            if (retry == maxRetryCount) {
                parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_FAIL_RETRY, `img need download again.`, param));
            }
            await delay(randomInt(2000, 4000));
        } finally {
            clearTimeout(timeout);
        }
    }
}