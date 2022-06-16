import {AsyncLocalStorage} from "async_hooks";


const asyncLocalStorage = new AsyncLocalStorage();

const store = {id: 2};
try {
    asyncLocalStorage.run(store, () => {
        let storage = asyncLocalStorage.getStore(); // Returns the store object
        setTimeout(() => {
            asyncLocalStorage.getStore(); // Returns the store object
        }, 200);
        throw new Error();
    });
} catch (e) {
    asyncLocalStorage.getStore(); // Returns undefined
    // The error will be caught here
}


