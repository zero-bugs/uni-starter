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
import {FappeningTbl} from "@prisma/client";
import {getFpOutPath} from "../config/ConfigFile.js";
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

    const BrowserLargeSize = async () => {
        const launchOptions = {
            devtools: false,
            headless: false,
            ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
            args: [`--start-maximized`],
        };
        const browser = await chromium.launch(launchOptions);
        const context = await browser.newContext({viewport: null});
        return {
            context: context,
            newPage: () => context.newPage(),
            close: () => browser.close(),
        };
    };

    const {newPage, context, close} = await BrowserLargeSize();
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
                    parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_FAIL_RETRY, '0', `img need download again.`, param));
                    printLogSync(LogLevel.CONSOLE, `image:${imgName} write local failed`);
                    return;
                }

                const arrayBuffer = await response?.body() as ArrayBuffer;
                const buffer = Buffer.from(arrayBuffer);
                await fs.writeFile(imgName, buffer, () => {
                    console.log("write success.")
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
                await delay(randomInt(500, 1000));
                await close();
            }
        });

        await page.goto(param.url, {
            waitUntil: 'networkidle',
        });
    } catch (error) {
        printLogSync(LogLevel.ERROR, `http failed, type:${typeof error}, error msg:${error}`);
        parentPort?.postMessage(new PostMsgEventEntry(PostMsgIdEnum.EVENT_FAIL_RETRY, '0', `img need download again.`, param));
        await delay(randomInt(2000, 4000));
    }
}

export async function fetchFpImgWithRetry(options: RequestInit, param: FappeningTbl) {
    // 判断是否下载过
    if (param.isUsed !== IsUsedStatus.UN_USED) {
        return false;
    }

    let proxy = getHttpsProxy();
    if (proxy) {
        options.agent = getHttpsProxy();
    }
    if (param.url === null || param.title === null) {
        printLogSync(LogLevel.ERROR, `url or title is null for url:${param.url}`);
        return false;
    }

    // 目录考虑时间，判断目录是否存在
    let dldPath = `${getFpOutPath()}/${param.name}/${param.title.replaceAll("?", "").replaceAll(":", "")}`
    if (!fs.existsSync(dldPath)) {
        fs.mkdirSync(dldPath, {recursive: true});
    }

    // 判断文件是否存在
    let imgNameArr = param.url?.trim().split('/');
    if (imgNameArr === undefined || imgNameArr === null) {
        printLogSync(LogLevel.ERROR, `obtain image name failed for url:${param.url}`);
        return false;
    }
    let imgName = `${dldPath}/${imgNameArr[imgNameArr.length - 1]}`;
    if (fs.existsSync(imgName)) {
        await pmsClient.fappeningTbl.update({
            where: {id: param.id},
            data: {
                isUsed: IsUsedStatus.USED,
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
            printLogSync(LogLevel.INFO, `begin to download img, url:${param.url}`);
            const response = await fetch(param.url, options);
            if (response.status === 404) {
                await pmsClient.fappeningTbl.update({
                    where: {id: param.id},
                    data: {
                        isUsed: IsUsedStatus.NOT_EXIST,
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

            printLogSync(LogLevel.INFO, `begin to write img: postId:${param.postId}, name:${param.name}, title:${param.title}`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            fs.appendFile(imgName, buffer, (err) => {
                if (err) {
                    printLogSync(LogLevel.CONSOLE, `image:${imgName} write local failed, err:${err}`);
                } else {
                    printLogSync(LogLevel.CONSOLE, `image:${imgName} write local success`);
                }
            });

            await pmsClient.fappeningTbl.update({
                where: {id: param.id},
                data: {
                    isUsed: IsUsedStatus.USED,
                }
            });

            return true;
        } catch (error) {
            printLogSync(LogLevel.ERROR, `http failed, type:${typeof error}, retry:${retry}, error msg:${error}`);
            ++retry;
            if (retry === maxRetryCount) {
                printLogSync(LogLevel.ERROR, `http request failed count has reached max, url:${param.url}`);
                await pmsClient.fappeningTbl.update({
                    where: {id: param.id},
                    data: {
                        isUsed: IsUsedStatus.NOT_LINK,
                    }
                });
            }
            await delay(randomInt(2000, 4000));
        } finally {
            clearTimeout(timeout);
        }
    }
    return false;
}