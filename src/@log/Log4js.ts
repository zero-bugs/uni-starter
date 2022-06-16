import {threadId} from "worker_threads";
import fs from "fs";
import * as os from "os";

const logPath = 'D:\\code\\uni-starter\\src\\log'
const defLog = `${logPath}\\app.log`;
const infoLog = `${logPath}\\info.log`;
const errLog = `${logPath}\\errors.log`;

export enum LogLevel {
    CONSOLE,
    DEBUG,
    INFO,
    ERROR,
}

export function logInit() {
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, {recursive: true});
    }
}

export function printLogSync(level: LogLevel = LogLevel.INFO, msg: any) {
    switch (level) {
        case LogLevel.CONSOLE:
            console.log(`[TID-${threadId}][${new Date().toUTCString()}]${msg}`);
            break;
        case LogLevel.INFO:
            fs.appendFile(infoLog, `[TID-${threadId}][${new Date()}]${msg}${os.EOL}`, err => {
                if (err) {
                    console.error(err)
                    return
                }
            });
            break
        case LogLevel.ERROR:
            fs.appendFile(errLog, `[TID-${threadId}][${new Date()}]${msg}${os.EOL}`, err => {
                if (err) {
                    console.error(err)
                    return
                }
            });
            break;
        default:
            fs.appendFile(defLog, `[TID-${threadId}][${new Date()}]${msg}${os.EOL}`, err => {
                if (err) {
                    console.error(err)
                    return
                }
            });
    }
}

