import { AzureFunction } from "@azure/functions"
import AppCache from "../src/AppCache";
import { AuthorizedAppInfo } from "../src/AppInfo";
import NewsCache from "../src/NewsCache";
import { NewsEntry } from "../src/types";

interface QueueItem {
    appId: string;
    authorization: AuthorizedAppInfo;
    news: NewsEntry[];
}

const queueTrigger: AzureFunction = async function (_, message: QueueItem): Promise<void> {
    const { appId, news } = message;
    if (news) {
        NewsCache.updateNews(news);
        return;
    }

    AppCache.invalidateCache(appId);
};

export default queueTrigger;
