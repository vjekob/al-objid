import { AppCacheInfo } from "../types/AppCacheInfo";
import { NewsEntry } from "../types/NewsEntry";

export type CheckResponse = {
    [key: string]: AppCacheInfo;
} & {
    _news: NewsEntry[];
};
