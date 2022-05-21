import {whSearchListDefault} from "../@handler/WhApiHandler.js";
import {TaskKeyId} from "../config/ConfigFile.js";
import {downloadImages} from "../@handler/dwlImgsHandler.js";

const TASK_MAP = new Map<string, any>();

TASK_MAP.set(TaskKeyId.WH_QUERY_01, whSearchListDefault);
TASK_MAP.set(TaskKeyId.CM_DOWNLOAD_01, downloadImages);
TASK_MAP.set(TaskKeyId.TASK_ID_DEF, () => {
})

export function getRegHandler(apiId: string): any {
    if (TASK_MAP.has(apiId)) {
        return TASK_MAP.get(apiId);
    }

    console.log(`api id ${apiId} has no handler...`)
    return TASK_MAP.get(TaskKeyId.TASK_ID_DEF);
}
