import {whSearchListDefault} from "../@handler/WhApiHandler.js";
import {ApiKeyId} from "../config/ConfigFile.js";

const API_MAP = new Map<string, any>();

API_MAP.set(ApiKeyId.WH_QUERY_01, whSearchListDefault);
API_MAP.set(ApiKeyId.API_ID_DEF, ()=>{})

export function getRegHandler(apiId: string): any {
    if (API_MAP.has(apiId)) {
        return API_MAP.get(apiId);
    }
    
    console.log(`api id ${apiId} has no handler...`)
    return API_MAP.get(ApiKeyId.API_ID_DEF);
}
