import path, {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {PrismaClient} from "@prisma/client";
import {LogLevel, printLogSync} from "../@log/Log4js.js";

const __filename = fileURLToPath(import.meta.url);
export const appDirName = dirname(__filename);
export const appRootDir = resolve(appDirName, "..");

export function getTemplatePath() {
    printLogSync(LogLevel.CONSOLE, `${__filename},${appDirName},${appRootDir}`);
    return `${resolve(appRootDir, "..")}${path.sep}templates`;
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
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const pmsClient = new PrismaClient({
    log: [
        {level: 'warn', emit: 'event'},
        {level: 'info', emit: 'event'},
        {level: 'error', emit: 'event'},
    ],
});
pmsClient.$on('warn', (e) => {
    printLogSync(LogLevel.CONSOLE, e);
})
pmsClient.$on('info', (e) => {
    printLogSync(LogLevel.CONSOLE, e);
})
pmsClient.$on('error', (e) => {
    printLogSync(LogLevel.CONSOLE, e);
})

export function getExtName(fileType: string) {
    let extName = fileType;
    if (extName.indexOf('/') !== -1) {
        extName = extName.substring(extName.indexOf('/') + 1);
    }

    if (['jpeg', 'jpg', 'jpe', 'jfif', 'jif'].includes(extName)) {
        return 'jpg';
    }

    return extName;
}
