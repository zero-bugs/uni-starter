import async_hooks from "async_hooks";
import fs from 'fs';
import http from "http";
const { fd } = process.stdout;
let indent = 0;
async_hooks.createHook({
    init(asyncId, type, triggerAsyncId) {
        const eid = async_hooks.executionAsyncId();
        const indentStr = ' '.repeat(indent);
        fs.writeSync(fd, `INIT:${indentStr}${type}(${asyncId}):` +
            ` trigger: ${triggerAsyncId} execution: ${eid}\n`);
    },
    before(asyncId) {
        const indentStr = ' '.repeat(indent);
        fs.writeSync(fd, `BEFORE:${indentStr}before:  ${asyncId}\n`);
        indent += 2;
    },
    after(asyncId) {
        indent -= 2;
        const indentStr = ' '.repeat(indent);
        fs.writeSync(fd, `AFTER:${indentStr}after:  ${asyncId}\n`);
    },
    destroy(asyncId) {
        const indentStr = ' '.repeat(indent);
        fs.writeSync(fd, `DESTROY:${indentStr}destroy:  ${asyncId}\n`);
    },
}).enable();
http.createServer().listen(8080, () => {
    // Let's wait 10ms before logging the server started.
    setTimeout(() => {
        console.log('>>>', async_hooks.executionAsyncId());
    }, 10);
});
//# sourceMappingURL=asyncHooks.js.map