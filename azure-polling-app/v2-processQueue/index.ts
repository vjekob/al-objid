import { AzureFunction } from "@azure/functions"
import AppCache from "../src/AppCache";
import { AuthorizedAppInfo } from "../src/AppInfo";
import NewsCache from "../src/NewsCache";
import { NewsEntry } from "../src/types";

interface QueueItem {
    appId: string;
    app: AuthorizedAppInfo;
    news: NewsEntry[];
}

const queueTrigger: AzureFunction = async function (context, message: QueueItem): Promise<void> {
    const { appId, app, news } = message;
    if (news) {
        NewsCache.updateNews(news);
        return;
    }

    const timestamp = Date.parse(context.bindingData?.insertionTime) || Date.now();

    AppCache.updateCache(appId, app, timestamp);
};

export default queueTrigger;
