import {FpCelebrityDetailEntry, FpCelebrityListEntry, UrlType} from "../@entry/FpEntryPo.js";
import {BrowserContext} from "@playwright/test";
import {Request, Route} from "playwright-core";
import {fpCreateWithCheckExist} from "../@utils/PsDbUtils.js";

export const ALPHABET_TABLE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export async function findCelebrityDetails(celebrityList: FpCelebrityDetailEntry[], context: BrowserContext) {
    if (celebrityList.length == 0) {
        return;
    }
    let curPage = await context.newPage();
    for (let entry of celebrityList) {
        // if (entry.url !== 'https://thefappening.pro/alexis-ren-nude-by-marco-glaviano-55-bts-photos/') {
        //     continue;
        // }

        await console.log(`---------------------------------------`);
        let fpResourceList: FpCelebrityDetailEntry[] = [];

        await curPage.route(new RegExp("(\.png)|(\.jpg)", "g"), (route: Route, request: Request) => {
            console.log(`jump url: ${request.url()}`);
            route.abort();
        });

        await curPage.goto(`${entry.url}`, {
            timeout: 0,
        });
        let articleLoc = await curPage.locator(`#${entry.postId}`);
        let locatorContent = await articleLoc.nth(0).locator('div > p');
        const detailCount = await locatorContent.count();
        let details = '';
        for (let j = 0; j < detailCount; ++j) {
            details += `${(await locatorContent.nth(j).textContent())?.trim()}
            `;
        }

        fpResourceList.push({
            postId: entry.postId,
            name: entry.name,
            title: entry.title,
            url: entry.url,
            urlType: UrlType.ARTICLE,
            summary: entry.summary,
            detail: details,
            createdTime: entry.createdTime,
        });

        //找到所有图片
        let fpResourceListTemp: FpCelebrityDetailEntry[] = [];
        let locatorImages = await articleLoc.nth(0).locator('div > p img');
        const countImages = await locatorImages.count();
        for (let j = 0; j < countImages; ++j) {
            let nextUrlLoc = await locatorImages.nth(j).getAttribute('src');
            if (nextUrlLoc === null || fpResourceListTemp.some(value => value.url === nextUrlLoc)) {
                continue;
            }
            fpResourceListTemp.push({
                postId: entry.postId,
                name: entry.name,
                title: entry.title,
                url: nextUrlLoc.trim(),
                urlType: UrlType.IMG,
                summary: '',
                detail: '',
                createdTime: entry.createdTime,
            });
        }

        //找到所有视频
        let locatorVideo = await articleLoc.nth(0).locator('div > div > video > source');
        const videoCount = await locatorVideo.count();
        for (let j = 0; j < videoCount; ++j) {
            let videoLink = await locatorVideo.nth(j).getAttribute("src");
            if (videoLink === null || videoLink === undefined) {
                continue;
            }

            fpResourceListTemp.push({
                postId: entry.postId,
                name: entry.name,
                title: entry.title,
                url: videoLink.trim(),
                urlType: UrlType.VIDEO,
                summary: '',
                detail: '',
                createdTime: entry.createdTime,
            });
        }

        fpResourceList = fpResourceList.concat(fpResourceListTemp);
        await console.log(`---------------------------------------`);

        // 写入数据表
        for (let value of fpResourceList) {
            await fpCreateWithCheckExist(value);
        }
    }
    await curPage.close()
}