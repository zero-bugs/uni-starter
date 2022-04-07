import path, {dirname, resolve} from "path";
import {fileURLToPath} from 'url'

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

export function getGlobalConfFile() {
    return `${getTemplatePath()}${path.sep}appConfig.json`;
}

import log4jsConf from 'log4js';
export const { configure, getLogger } = log4jsConf;
