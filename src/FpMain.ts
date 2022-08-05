import {FpArticleDetailsList, FpArticleList} from "./fappening/FpListImpl.js";

(async () => {
    await FpArticleList();
    await FpArticleDetailsList();
})();