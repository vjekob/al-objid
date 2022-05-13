import { AppCacheInfo } from "./AppCacheInfo";
import { NewsEntry } from "./NewsEntry";

export type CheckResponse = {
    [key: string]: AppCacheInfo;
} & {
    _news: NewsEntry[];
};
