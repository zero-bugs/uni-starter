import fs from "fs";
import {getApiListFile, getGlobalConfFile, getPwListFile} from "../@utils/Utils.js";

export enum PicLibType {
    WH = "wh",
    KH = "kh",
    YD = "yd",
    FP = "fp",
}

export enum TaskKeyId {
    WH_QUERY_ALL_01 = "WH_QUERY_ALL_01", // search all
    WH_QUERY_02 = "WH_QUERY_02", // search latest
    WH_QUERY_03 = "WH_QUERY_03", // search hottest
    WH_QUERY_04 = "WH_QUERY_04",
    WH_DOWNLOAD_ALL_01 = "WH_DOWNLOAD_ALL_01",
    WH_DOWNLOAD_ONE_01 = 'WH_DOWNLOAD_ONE_01',
    FP_QUERY_01 = "FP_QUERY_01",
    TASK_ID_DEF = "ID_DEFAULT"
}

export enum ApiKeyId {
    WH_QUERY_01 = 'WH_QUERY_01',
    WH_QUERY_02 = 'WH_QUERY_02',
    WH_QUERY_03 = 'WH_QUERY_03',
    WH_QUERY_04 = 'WH_QUERY_04',
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
    if (apiId === null || apiId === undefined) {
        apiId = ApiKeyId.WH_QUERY_01;
    }
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

export function getFetchType() {
    return globalConfig["type"];
}

export function getPicOutputPath() {
    return globalConfig['picOutputPath'];
}

export function getContinueSwitch() {
    return globalConfig['continueSwitch']
}

export const pwConfigList = JSON.parse(
    fs.readFileSync(getPwListFile(), "utf-8")
);


export function getFpAddress(type:string = 'fp'): string {
    let basicObj = pwConfigList[type].basic;
    return `${basicObj.protocol}://${basicObj.host}`;
}

export function getFpOutPath(type:string = 'fp'): string {
    return `${pwConfigList[type].picOutputPath}/${type}`;
}