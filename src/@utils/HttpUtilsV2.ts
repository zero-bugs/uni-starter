// JUst for resist CloudFare check


import fetch, {AbortError, RequestInit} from "node-fetch";
import {randomInt} from "crypto";
import {parentPort, threadId} from "worker_threads";

import {ImgEntryPo, ResImgEntryPo} from "../@entry/ImgEntryPo.js";
import {delay, pmsClient} from "./Utils.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import * as fs from "fs";
import {getHttpsProxy} from "../config/ProxyConfig.js";
import {PostMsgEventEntry, PostMsgIdEnum} from "../@entry/PostMsgEventEntry.js";
import {IsUsedStatus} from "../@entry/IsUsedStatus.js";
import {DownloadParams} from "../@entry/DownloadEntryPo.js";
import {QueryParam} from "../@entry/QueryPo.js";
import {chromium} from "@playwright/test";

const maxRetryCount = 3;

export async function fetchWithRetryV2(pageUrlLink: string, queryParam: QueryParam) {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 100,
        timeout: 600000
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    let respJson: ResImgEntryPo;
    let imagePoList = new Array<ImgEntryPo>();

    let retry = 0;
    while (retry < maxRetryCount) {
        try {
            await page.goto(pageUrlLink, {
                timeout: 600000,
            });
            const bodyLoc = await page.locator('body > pre').innerHTML();
            const data = JSON.parse(bodyLoc);
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
            parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_NORMAL, '0', `threadId-${threadId}, url:${pageUrlLink} failed. msg:${error}`, undefined));
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
        }
    }
    await page.close();
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

const BrowserLargeSize = async () => {
    const launchOptions = {
        devtools: true,
        bodySize: 1024*1024*200,
        headless: false,
        ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
        args: [`--start-maximized`],
        timeout: 600000,
    };
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({viewport: null});
    return {
        context: context,
        newPage: () => context.newPage(),
        close: () => browser.close(),
    };
};

const {newPage, context} = await BrowserLargeSize();
const maxLongWait = 60000;

export async function fetchImgWithRetryV2(options: RequestInit, param: DownloadParams) {
    // 判断是否下载过
    if (param.isUsed !== IsUsedStatus.UN_USED) {
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
                isUsed: IsUsedStatus.USED,
            }
        });
        return false;
    }

    let isEnd = false;
    let waitTime = 0;

    const page = await newPage();
    const client = await page.context().newCDPSession(page);
    await client.send('Page.setLifecycleEventsEnabled', {enabled: true});
    await client.send('Network.enable', {
        maxResourceBufferSize: 1024 * 1024 * 100,
        maxTotalBufferSize: 1024 * 1024 * 200,
        maxPostDataSize: 1024 * 1024 * 200,
    });

    try {
        printLogSync(LogLevel.INFO, `begin to download img:${param.imgId}.${param.extName}, url:${param.url}`);

        context.on('response', async response => {
            try {
                if (response?.status() === 404) {
                    await pmsClient.image.update({
                        where: {imgId: param.imgId},
                        data: {
                            isUsed: IsUsedStatus.NOT_EXIST,
                        }
                    });

                    printLogSync(LogLevel.INFO, `image not exist, url:${param.url}, response:${response?.status}}`);
                    return;
                }

                if (response?.status() !== 200) {
                    printLogSync(LogLevel.CONSOLE, `image:${imgName} write local failed`);
                    return;
                }

                const arrayBuffer = await response?.body() as ArrayBuffer;
                const buffer = Buffer.from(arrayBuffer);
                await fs.writeFile(imgName, buffer, () => {
                    printLogSync(LogLevel.INFO,`write:${imgName} success.`)
                })

                printLogSync(LogLevel.CONSOLE, `image:${imgName} write local success`);

                await pmsClient.image.update({
                    where: {imgId: param.imgId},
                    data: {
                        isUsed: IsUsedStatus.USED,
                    }
                });
            } catch (e) {
                printLogSync(LogLevel.ERROR, `image:${imgName} write local failed, url:${param.url}, error:${e}`);
            } finally {
                isEnd = true;
                await page.close();
            }
        });

        await page.goto(param.url, {
            waitUntil: 'networkidle',
            timeout: 60000,
        });

        //等待异步数据写完毕。
        while (!isEnd && waitTime < maxLongWait) {
            await delay(1000);
            waitTime += 1000;
        }
        if (waitTime === maxLongWait) {
            await page.close();
        }
    } catch (error) {
        printLogSync(LogLevel.ERROR, `http failed, type:${typeof error}, error msg:${error}`);
        await delay(randomInt(2000, 4000));
    }
}
