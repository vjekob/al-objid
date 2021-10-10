import { Blob } from "@vjeko.com/azure-func";
import { NewsEntry } from "./types";

class NewsCache {
    private _news?: NewsEntry[];

    private async readNews() {
        const blob = new Blob<NewsEntry[]>("news.json", process.env.NewsContainer);
        this._news = await blob.read() || [];
    }

    async getNews(): Promise<NewsEntry[]> {
        if (!this._news) {
            await this.readNews();
        }
        return this._news;
    }

    updateNews(news: NewsEntry[]) {
        this._news = news || [];
    }
}

export default new NewsCache();
