import path, {dirname, resolve} from "path";
import {fileURLToPath} from 'url'
import {PrismaClient} from '@prisma/client';
import log4jsConf from 'log4js';

const __filename = fileURLToPath(import.meta.url)
export const appDirName = dirname(__filename)
export const appRootDir = resolve(appDirName, '..')

export function getTemplatePath() {
    console.log(`${__filename},${appDirName},${appRootDir}`)
    return `${resolve(appRootDir, '..')}${path.sep}templates`
}

export function getLog4jsConfFile() {
    return `${getTemplatePath()}${path.sep}log4js.json`;
}

export function getApiListFile() {
    return `${getTemplatePath()}${path.sep}apiList.json`;
}

export function getProxyConfFile() {
    return `${getTemplatePath()}${path.sep}proxyConfig.json`;
}

export function getGlobalConfFile() {
    return `${getTemplatePath()}${path.sep}appConfig.json`;
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDbClient() {
    return new PrismaClient();
}

export const {configure, getLogger} = log4jsConf;
