import {delay, pmsClient} from "../@utils/Utils.js";
import {fetchImgWithRetry} from "../@utils/HttpUtils.js";
import {RequestInit} from "node-fetch";
import {getHttpsProxy} from "../config/ProxyConfig.js";
import {getFetchType, getPicOutputPath} from "../config/ConfigFile.js";
import {randomInt} from "crypto";

export async function downloadImages(dwlEntryPo: DownloadEntryPo) {
    if (dwlEntryPo.sinceBegin == null) {
        dwlEntryPo.sinceBegin = new Date("1970-01-01 00:00:00");
    }
    if (dwlEntryPo.sinceEnd == null) {
        dwlEntryPo.sinceEnd = new Date();
    }

    // 找到第一幅图片
    const image = await pmsClient.image.findFirst({
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
    await fetchImgWithRetry(options, {
        category: image.category,
        purity: image.purity,
        imgId: String(image.imgId),
        rootPath: `${getPicOutputPath()}/${getFetchType()}`,
        url: image.path,
        extName: getExtName(image.fileType),
    })

    let cursor = image?.id;

    let start = dwlEntryPo.start === 0 ? 1 : dwlEntryPo.start;
    let limit = dwlEntryPo.limit;


    while (start <= dwlEntryPo.end && dwlEntryPo.limit === limit) {
        if (start + limit > dwlEntryPo.end) {
            limit = dwlEntryPo.end - start;
        }
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

        if (images.length === 0) {
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

            await fetchImgWithRetry(options, {
                category: img.category,
                purity: img.purity,
                imgId: String(img.imgId),
                rootPath: `${getPicOutputPath()}/${getFetchType()}`,
                url: img.path,
                extName: getExtName(img.fileType),
            })

            await delay(randomInt(3000, 6000));
        }
    }
}

function getExtName(fileType: string) {
    let extName = fileType;
    if (extName.indexOf('/') !== -1) {
        extName = extName.substring(extName.indexOf('/') + 1);
    }

    if (['jpeg', 'jpg', 'jpe', 'jfif', 'jif'].includes(extName)) {
        return 'jpg';
    }

    return extName;
}
