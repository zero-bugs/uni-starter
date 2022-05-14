import path, {dirname} from "path";
import pkg from 'log4js';
import {threadId} from "worker_threads";

import {getTemplatePath} from "../@utils/Utils.js";
import fs from "fs";
import {fileURLToPath} from "url";
import * as os from "os";

const {configure, getLogger} = pkg;

const __filename = fileURLToPath(import.meta.url);
const appDirName = dirname(__filename);

export function intLog4j() {
    configure(getLog4jsConfFile());
}

export function getLog4js(name: string) {
    return getLogger(name);
}

export function formatMsg(msg: string | unknown) {
    return `[TID-${threadId}][${msg}]`;
}

function getLog4jsConfFile() {
    return `${getTemplatePath()}${path.sep}log4js.json`;
}

export function appendLogSyncAppLog(msg: string) {
    fs.appendFile(`${appDirName}/../log/app.log`, `${msg}${os.EOL}`, err => {
        if (err) {
            console.error(err)
            return
        }
    });
}

export function appendLogSyncErrLog(msg: string) {
    fs.appendFile(`${appDirName}/../log/errors.log`, `${msg}${os.EOL}`, err => {
        if (err) {
            console.error(err)
            return
        }
    });
}

