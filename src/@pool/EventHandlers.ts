import {whSearchListDefault, whSearchListLatest} from "../@handler/WhApiHandler.js";
import {TaskKeyId} from "../config/ConfigFile.js";
import {downloadImages, downloadSingleImage} from "../@handler/dwlImgsHandler.js";
import {LogLevel, printLogSync} from "../@log/Log4js.js";

const TASK_MAP = new Map<string, any>();

TASK_MAP.set(TaskKeyId.WH_QUERY_ALL_01, whSearchListDefault);
TASK_MAP.set(TaskKeyId.WH_QUERY_02, whSearchListLatest);
TASK_MAP.set(TaskKeyId.WH_DOWNLOAD_ALL_01, downloadImages);
TASK_MAP.set(TaskKeyId.WH_DOWNLOAD_ONE_01, downloadSingleImage);
TASK_MAP.set(TaskKeyId.TASK_ID_DEF, () => {
})

export function getRegHandler(taskId: string): any {
    if (TASK_MAP.has(taskId)) {
        return TASK_MAP.get(taskId);
    }

    printLogSync(LogLevel.CONSOLE, `api id ${taskId} has no handler...`)
    return TASK_MAP.get(TaskKeyId.TASK_ID_DEF);
}
