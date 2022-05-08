import fs from "fs";
import {getApiListFile, getGlobalConfFile} from "../@utils/Utils.js";

export enum PicLibType {
    WH = "wh",
    KH = "kh",
    YD = "yd",
}

export enum ApiKeyId {
    WH_QUERY_01 = "WH_QUERY_01",
    WH_QUERY_02 = "WH_QUERY_02",
    WH_QUERY_03 = "WH_QUERY_03",
    WH_QUERY_04 = "WH_QUERY_04",
    API_ID_DEF = "API_DEFAULT"
}

export const apiListConf = JSON.parse(
    fs.readFileSync(getApiListFile(), "utf-8")
);

const globalConfig = JSON.parse(fs.readFileSync(getGlobalConfFile(), "utf-8"));

export function getBaseList(): string {
    let apiType = globalConfig["type"];
    let basicObj = apiListConf[apiType].basic;
    return `${basicObj.protocol}://${basicObj.host}`;
}

export function getApiEndpoint(apiId: string): string {
    let apiType = globalConfig["type"];
    let basicObj = apiListConf[apiType].basic;
    let uri = "";
    basicObj.apiList.forEach((element: { apiId: string; uri: string }) => {
        if (element.apiId === apiId) {
            uri = element.uri;
        }
    });
    return `${getBaseList()}${uri}`;
}

export function getApiKey(): string {
    return globalConfig["apikey"];
}
