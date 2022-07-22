import {chromium, Page} from "@playwright/test"
import {Locator, Request, Route} from "playwright-core";
import {FpCelebrityDetailEntry, FpCelebrityListEntry, UrlType} from "./@entry/FpEntryPo.js";
import {LogLevel, printLogSync} from "./@log/Log4js.js";
import {fpCreateWithCheckExist} from "./@utils/PsDbUtils.js";

async function getTextFromPage(page: Page, selector: string) {
    const locName = await page.locator(selector);
    let name = await locName.textContent()
    if (name === null) {
        return "";
    }
    return name.trim();
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

/**
 * 返回下一页的地址
 * @param celebrityList
 * @param page
 * @param celebrityUrl
 */
async function getSinglePageList(celebrityList: FpCelebrityListEntry[], page: Page, celebrityUrl: string) {
    await page.route(new RegExp("(\.png)|(\.jpg)", "g"), (route: Route, request: Request) => {
        console.log(`jump url: ${request.url()}`);
        route.abort();
    })
    await page.goto(celebrityUrl, {
        timeout: 300000
    });

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
    if ((await locatorNav.count() >= 1)) {
        let pageContent = await locatorNav.textContent();
        if (pageContent !== null && pageContent.trim().includes("Older posts")) {
            nextPage = await locatorNav.getAttribute('href')
        }
    }

    return nextPage;
}

(async () => {
    const browser = await chromium.launch({headless: false, slowMo: 100, timeout: 300000, downloadsPath: 'E:\\cache'});
    // Create a new incognito browser context.
    const context = await browser.newContext();
    // Create a new page in a pristine context.
    const page = await context.newPage();

    // //TODO
    // await page.goto('https://thefappening.pro/all-actresses-list/');
    //
    // const locator = await page.locator('.letter-section > ul > li a');
    // const count = await locator.count();
    // console.log(`fp all count:${count}`);
    //
    // let fpList: FpEntry[] = [];
    // for (let i = 0; i < count; ++i) {
    //     // let locatorInner = await locator.nth(i);
    //     let href = await locator.nth(i).getAttribute('href');
    //     let name = await locator.nth(i).textContent();
    //
    //     if (href === null || name === null) {
    //         continue;
    //     }
    //
    //     await console.log(`index:${i}, att:${href.trim()}, name:${name.trim()}`);
    //
    //     fpList.push({
    //         name: name.trim(),
    //         url: href.trim()
    //     })
    // }
    // for (const entry of fpList) {
    //     // 访问新页面
    //     const subPage = await context.newPage();
    //     await subPage.goto(entry.url);
    // }

    // TODO
    let celebrityList: FpCelebrityListEntry[] = [];
    let celebritySinglePage = 'https://thefappening.pro/megan-fox/';
    while (celebritySinglePage !== '') {
        let nextPage = await getSinglePageList(celebrityList, page, celebritySinglePage);
        if (nextPage === null || nextPage === undefined || nextPage === '') {
            celebritySinglePage = ''
            continue;
        }
        celebritySinglePage = nextPage.trim();
    }
    await page.close()


    for (let entry of celebrityList) {
        await console.log(`---------------------------------------`);
        let fpPicList: FpCelebrityDetailEntry[] = [];
        let page = await context.newPage();
        await page.route(new RegExp("(\.png)|(\.jpg)", "g"), (route: Route, request: Request) => {
            console.log(`jump url: ${request.url()}`);
            route.abort();
        })
        await page.goto(entry.url, {
            timeout: 300000,
        })
        let articleLoc = await page.locator(`#${entry.postId}`)
        let locatorContent = await articleLoc.nth(0).locator('div > p');
        const detailCount = await locatorContent.count();
        let details = '';
        for (let j = 0; j < detailCount; ++j) {
            details += `${(await locatorContent.nth(j).textContent())?.trim()}
            `;
        }

        fpPicList.push({
            postId: entry.postId,
            name: entry.name,
            title: entry.title,
            url: entry.url,
            urlType: UrlType.TEXT,
            summary: entry.summary,
            detail: details,
            createdTime: entry.createdTime,
        });

        //
        let fpPicListTemp: FpCelebrityDetailEntry[] = [];
        let locatorImages = await articleLoc.nth(0).locator('div > p img');
        const countImages = await locatorImages.count();
        for (let j = 0; j < countImages; ++j) {
            let nextUrlLoc = await locatorImages.nth(j).getAttribute('src');
            if (nextUrlLoc === null || fpPicListTemp.some(value => value.url === nextUrlLoc)) {
                continue;
            }
            fpPicListTemp.push({
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
        fpPicList = fpPicList.concat(fpPicListTemp);
        await page.close()
        await console.log(`---------------------------------------`);

        // 写入数据表
        for(let value of fpPicList) {
            await fpCreateWithCheckExist(value);
        }
    }



    // const texts2 = await locator.evaluateAll(list => list.map(element => element.textContent));
    // await console.log(texts2);
    // hrefs.forEach((href, index) => {#letter-A > ul > li:nth-child(1)
    //     const filePath = `${reliablePath}-${index}`;
    //     const file = fs.createWriteStream(filePath);
    //     file.on('pipe', (src) => console.log(`${filePath} started`));
    //     file.on('finish', (src) => console.log(`${filePath} downloaded`
    //     https.get(href, function(response) {
    //         response.pipe(file);
    //     });
    // });


    await page.close();
})();