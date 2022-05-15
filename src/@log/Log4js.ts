import path from "path";
import pkg from 'log4js';
import {threadId} from "worker_threads";

import {getTemplatePath} from "../@utils/Utils.js";
import fs from "fs";
import * as os from "os";

const {configure, getLogger} = pkg;

const appLog = 'D:\\code\\uni-starter\\src\\log\\app.log';
const errLog = 'D:\\code\\uni-starter\\src\\log\\errors.log';

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
    fs.appendFile(appLog, `${msg}${os.EOL}`, err => {
        if (err) {
            console.error(err)
            return
        }
    });
}

export function appendLogSyncErrLog(msg: string) {
    fs.appendFile(errLog, `${msg}${os.EOL}`, err => {
        if (err) {
            console.error(err)
            return
        }
    });
}

