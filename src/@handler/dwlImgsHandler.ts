import {delay, getExtName, pmsClient} from "../@utils/Utils.js";
import {RequestInit} from "node-fetch";
import {getHttpsProxy} from "../config/ProxyConfig.js";
import {getFetchType, getPicOutputPath} from "../config/ConfigFile.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import {randomInt} from "crypto";
import {DownloadEntryPo, DownloadParams} from "../@entry/DownloadEntryPo.js";
import {fetchImgWithRetryV2} from "../@utils/HttpUtilsV2.js";

export async function downloadSingleImage(param: DownloadParams) {
    let options: RequestInit = {
        headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        }
    };
    await fetchImgWithRetryV2(options, {
        category: param.category,
        purity: param.purity,
        imgId: String(param.imgId),
        createTime: param.createTime,
        sinceBegin: param.sinceBegin,
        sinceEnd: param.sinceEnd,
        rootPath: param.rootPath,
        url: param.url,
        extName: getExtName(param.extName),
        isUsed: param.isUsed
    })
}

export async function downloadImages(dwlEntryPo: DownloadEntryPo) {
    if (dwlEntryPo.sinceBegin == null) {
        dwlEntryPo.sinceBegin = new Date("1970-01-01 00:00:00");
    }
    if (dwlEntryPo.sinceEnd == null) {
        dwlEntryPo.sinceEnd = new Date();
    }

    if (dwlEntryPo.start <= 1) {
        dwlEntryPo.start = 1;
    }

    // 找到第一幅图片
    const image = await pmsClient.image.findFirst({
        skip: dwlEntryPo.start - 1,
        take: 1,
        where: {
            AND: [
                {
                    category: dwlEntryPo.category,
                },
                {
                    purity: dwlEntryPo.purity
                }
            ]
        },
        orderBy: {
            createdTime: 'desc'
        }
    });
    if (image === null || image === undefined) {
        return;
    }
    let options: RequestInit = {};
    await fetchImgWithRetryV2(options, {
        category: image.category,
        purity: image.purity,
        imgId: String(image.imgId),
        createTime: image.createdTime,
        sinceBegin: dwlEntryPo.sinceBegin,
        sinceEnd: dwlEntryPo.sinceEnd,
        rootPath: `${getPicOutputPath()}/${getFetchType()}`,
        url: image.path,
        extName: getExtName(image.fileType),
        isUsed: image.isUsed
    })

    let cursor = image?.id;

    let start = dwlEntryPo.start === 0 ? 1 : dwlEntryPo.start;
    let limit = dwlEntryPo.limit;


    while (start <= dwlEntryPo.end && dwlEntryPo.limit === limit) {
        if (start + limit > dwlEntryPo.end) {
            limit = dwlEntryPo.end - start;
        }

        printLogSync(LogLevel.INFO, `begin download start:${start}-end:${dwlEntryPo.end}, cursor:${cursor}, limit:${limit}`);

        const images = await pmsClient.image.findMany({
            take: limit,
            skip: 1,// Skip the cursor
            cursor: {
                id: cursor,
            },
            where: {
                AND: [
                    {
                        category: dwlEntryPo.category,
                    },
                    {
                        purity: dwlEntryPo.purity
                    }
                ]
            },
            orderBy: {
                createdTime: 'desc'
            }
        });

        if (images === null || images == undefined || images.length === 0) {
            break;
        }

        cursor = images[images?.length - 1].id;
        start = start + limit;

        //download images
        for (let img of images) {
            let options: RequestInit = {};
            let proxy = getHttpsProxy();
            if (proxy) {
                options.agent = getHttpsProxy();
            }

            let res = await fetchImgWithRetryV2(options, {
                category: img.category,
                purity: img.purity,
                imgId: String(img.imgId),
                createTime: img.createdTime,
                sinceBegin: dwlEntryPo.sinceBegin,
                sinceEnd: dwlEntryPo.sinceEnd,
                rootPath: `${getPicOutputPath()}/${getFetchType()}`,
                url: img.path,
                extName: getExtName(img.fileType),
                isUsed: img.isUsed
            })

            if (res?.valueOf() === false) {
                // await delay(randomInt(500, 1000));
                continue;
            }
            await delay(randomInt(2000, 4000));
        }
    }
}
