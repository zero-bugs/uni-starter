import fs from "fs";
import {getApiListFile, getGlobalConfFile} from "../@utils/utils.js";

export enum PicLibType {
    WH = "wh",
    KH = "kh",
    YD = "yd",
}

export const apiListConf = JSON.parse(fs.readFileSync(getApiListFile(), 'utf-8'));

const globalConfig = JSON.parse(fs.readFileSync(getGlobalConfFile(), 'utf-8'));

export function getBaseList(apiId: string): string {
    let apiType = globalConfig['type'];
    let basicObj = apiListConf[apiType].basic;
    return `${basicObj.protocol}://${basicObj.host}`;
}
