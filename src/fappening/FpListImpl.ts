import {BrowserContext, chromium, Page} from "@playwright/test"
import {Locator, Request, Route} from "playwright-core";
import {FpCelebrityDetailEntry, FpCelebrityListEntry, FpEntry, UrlType} from "../@entry/FpEntryPo.js";
import {
    fpCheckArticleExist,
    fpCreateWithCheckArticleExist,
    fpGetArticleList, fpGetPictureList,
    updateArticleUsed
} from "../@utils/PsDbUtils.js";
import {ALPHABET_TABLE, findCelebrityDetails} from "./FpUtils.js";
import {FP_LIST_URL} from "./FpConstant.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";
import {randomInt} from "crypto";
import {delay} from "../@utils/Utils.js";
import {FappeningTbl} from "@prisma/client";
import {fetchFpImgWithRetry} from "../@utils/HttpUtils.js";
import {RequestInit} from "node-fetch";


async function findCelebritiesListByLetterPrefix(page: Page, key: string) {
    const locator = await page.locator(`#letter-${key} a`);
    const count = await locator.count();
    console.log(`fp all count:${count}`);

    let fpList: FpEntry[] = [];
    for (let i = 0; i < count; ++i) {
        let href = await locator.nth(i).getAttribute('href');
        let name = await locator.nth(i).textContent();
        if (href === null || name === null) {
            continue;
        }

        console.log(`index:${i}, att:${href.trim()}, name:${name.trim()}`);

        fpList.push({
            name: name.trim(),
            url: href.trim()
        })
    }
    return fpList;
}


/**
 * 找到单个明星的所有article
 *
 * @param celebrityList
 * @param context
 * @param celebrityUrl
 * @return 返回下一页的地址
 */
async function getCelebrityArticlesList(celebrityList: FpCelebrityListEntry[], context: BrowserContext, celebrityUrl: string) {
    const page = await context.newPage();
    await page.route(new RegExp("(\.png)|(\.jpg)", "g"), (route: Route, request: Request) => {
        console.log(`jump url: ${request.url()}`);
        route.abort();
    })
    await page.goto(`${celebrityUrl}`, {
        timeout: 600000
    });

    // 判断内容是否存在，有可能详情页面不含有内容
    if (await judgeContextExistOrNot(page, '#content')) {
        await page.close();
        return null;
    }


    // 获取Name
    const name = await getTextFromPage(page, '#content > header > h1 > span');

    const locatorArticles = await page.locator('#content > article');
    const count = await locatorArticles.count();
    await console.log(`fp all count:${count}`);

    for (let i = 0; i < count; ++i) {
        await console.log('---------------------------------------');
        const postId = await getAttributeFromLoc(await locatorArticles.nth(i), "id");
        let locatorTitle = await locatorArticles.nth(i).locator('header > h2 > a');
        let title = await getTextFromLoc(locatorTitle);
        let url = await getAttributeFromLoc(locatorTitle, 'href');
        if (postId === "" || title === "" || url === "") {
            printLogSync(LogLevel.ERROR, `postId:${postId}, title:${title}, url:${url} is empty form page:${celebrityUrl}`)
            continue;
        }

        let locatorContent = await locatorArticles.nth(i).locator('div > div p');
        let summary = '';
        const summaryCount = await locatorContent.count();
        for (let i = 0; i < summaryCount; ++i) {
            summary += (await locatorContent.nth(i).textContent())?.trim();
        }

        let timeText = await locatorArticles.nth(i).locator('footer > a > time').getAttribute('datetime')
        let createTime = new Date();
        if (timeText !== null) {
            createTime = new Date(timeText.trim());
        }

        celebrityList.push({
            postId: postId,
            name: name,
            title: title,
            url: url,
            summary: summary.trim(),
            createdTime: createTime,
        })

        await console.log(`name:${name}, title:${title.trim()}, url:${url.trim()}`);
        await console.log(`summary:${summary.trim()}`);
        await console.log(`create time: ${createTime}`);
        await console.log('---------------------------------------');
    }

    const locatorNav = await page.locator('#content > nav > .nav-previous > a');
    let nextPage;
    const navCount = await locatorNav.count();
    if ((navCount >= 1)) {
        let pageContent = await locatorNav.textContent();
        if (pageContent !== null && pageContent.trim().includes("Older posts")) {
            nextPage = await locatorNav.getAttribute('href')
        }
    }

    await page.close();
    return nextPage;
}

async function getTextFromPage(page: Page, selector: string) {
    const locName = await page.locator(selector);
    let name = await locName.textContent()
    if (name === null) {
        return "";
    }
    return new TextDecoder().decode(new TextEncoder().encode(name)).trim();
}

async function getTextFromLoc(locator: Locator) {
    let text = await locator.textContent()
    if (text === null) {
        return "";
    }
    return text.trim();
}

async function getAttributeFromLoc(locator: Locator, key: string) {
    let postId = await locator.getAttribute(key);
    if (postId === null) {
        return "";
    }
    return postId.trim();
}

async function judgeContextExistOrNot(page: Page, selector: string) {
    const locName = await page.locator(selector);
    let name = await locName.textContent()
    return name === null || name.includes('Nothing Found');
}

export async function FpArticleList() {
    const browser = await chromium.launch({headless: true, slowMo: 100, timeout: 600000});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(FP_LIST_URL, {
        timeout: 600000,
    });

    for (let key of ALPHABET_TABLE) {
        let fpList = await findCelebritiesListByLetterPrefix(page, key);

        // 找到单个人文章列表
        for (const entry of fpList) {

            // if (entry.url ===null|| entry.url < 'https://thefappening.pro/zahara-davis/') {
            //     continue;
            // }

            let celebrityList: FpCelebrityListEntry[] = [];
            let celebritySingleUrl = entry.url;
            while (celebritySingleUrl !== '') {
                let nextPage = await getCelebrityArticlesList(celebrityList, context, celebritySingleUrl);
                if (nextPage === null || nextPage === undefined || nextPage === '') {
                    celebritySingleUrl = ''
                    continue;
                }
                celebritySingleUrl = nextPage.trim();
            }

            // 写入数据库
            for (let val of celebrityList) {
                if (!await fpCreateWithCheckArticleExist({
                    postId: val.postId,
                    name: val.name,
                    title: val.title,
                    url: val.url,
                    urlType: UrlType.ARTICLE,
                    summary: val.summary,
                    detail: '',
                    createdTime: val.createdTime,
                })) {
                    console.log(`entry postId:${val.postId}, url:${val.url} exist, continue....`);
                }
            }
            await delay(randomInt(1000, 2000));
        }
    }
    await page.close();
}


export async function FpArticleDetailsList() {
    const articleList = await fpGetArticleList();
    if (articleList === null || articleList.length === 0) {
        printLogSync(LogLevel.CONSOLE, `no article for handle ...`)
        return;
    }

    const browser = await chromium.launch({headless: false, slowMo: 100, timeout: 600000});
    const context = await browser.newContext();

    for (let article of articleList) {
        if (article.postId === null || article.name === null) {
            printLogSync(LogLevel.CONSOLE, `postId or name is null...`)
            continue;
        }

        if ((await fpCheckArticleExist(article.postId)) === null) {
            printLogSync(LogLevel.CONSOLE, `article:${article.postId} has been handled...`)
            continue;
        }

        let celebrityList: FpCelebrityDetailEntry[] = [];
        celebrityList.push({
            postId: article?.postId,
            name: article.name,
            title: article.title,
            url: article.url,
            urlType: article.urlType,
            summary: article.summary,
            detail: article.detail,
            createdTime: article.createdTime,
        });
        await findCelebrityDetails(celebrityList, context);

        const count = await updateArticleUsed(article.id);
        printLogSync(LogLevel.CONSOLE, `update result ${count} for url:${article.url}, name:${article.name}`)
    }
    await browser.close();
}

export async function FpArticleDownload() {
    const entryList: FappeningTbl[] = await fpGetPictureList();
    for (let entry of entryList) {
        let options: RequestInit = {};
        await fetchFpImgWithRetry(options, entry);
    }
}