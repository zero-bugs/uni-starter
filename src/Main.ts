import {pmsClient} from "./@utils/Utils.js";
import {main} from "./MultiThreads.js";
import {intLog4j} from "./@log/Log4js.js";

intLog4j();

main().catch(async (reason) => {
    console.log(`main function execute failed, reason:${reason}`);
    console.log(`warning, closing client.....`)
    await pmsClient.$disconnect();
});
