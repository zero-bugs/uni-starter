import {pmsClient} from "./@utils/Utils.js";
import {main} from "./MultiThreads.js";
import {logInit, LogLevel, printLogSync} from "./@log/Log4js.js";

logInit();

main().catch(async (reason) => {
    printLogSync(LogLevel.CONSOLE, `main function execute failed, reason:${reason}`);
    printLogSync(LogLevel.CONSOLE, `warning, closing client.....`)
    await pmsClient.$disconnect();
});
