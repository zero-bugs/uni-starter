import path from "path";
import pkg from 'log4js';
import {threadId} from "worker_threads";

import {getTemplatePath} from "../@utils/Utils.js";

const {configure, getLogger} = pkg;

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

