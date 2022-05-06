import { ALObjectType } from "./constants";
import { ALRange } from "./types";

export interface NextObjectIdInfo {
    id: number | number[];
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
    perRange?: boolean;
    require?: number;
}

export interface ConsumptionInfo {
    [key: string]: number[];
}

export interface AuthorizationInfo {
    authKey: string;
}

export interface AuthorizedAppResponse {
    authorized: boolean;
    valid: boolean;
    user: {
        name: string;
        email: string;
        timestamp: number;
    };
}

export interface AuthorizationDeletedInfo {
    deleted: boolean;
}

export interface FolderAuthorization {
    appId: string;
    authKey: string;
}

export interface AuthorizedAppConsumption {
    appId: string;
    authKey: string;
    ids: ConsumptionInfo;
}

export type EventType = "getNext" | "syncFull" | "syncMerge" | "authorize" | "deauthorize";

export interface EventLogEntry {
    eventType: EventType;
    timestamp: number;
    user: string;
    data: any;
}

export type ConsumptionData = {
    [key in ALObjectType]: number[];
};

export type AppCacheInfo = {
    _ranges: ALRange[];
    _log: EventLogEntry[];
} & ConsumptionData;

export type CheckResponse = {
    [key: string]: AppCacheInfo;
} & {
    _news: NewsEntry[];
};

export type ConsumptionInfoWithTotal =
    | ConsumptionInfo
    | {
          _total: number;
      };

export enum NewsType {
    announcement = "announcement",
    openmd = "openmd",
}

export enum NewsActionType {
    dismiss = "dismiss",
    snooze = "snooze",
    url = "url",
}

export interface NewsButton {
    caption: string;
    action: NewsActionType;
    parameter?: any;
}

export interface NewsEntry {
    id: string;
    type: NewsType;
    message: string;
    buttons: NewsButton[];
}

export interface NewsResponse {
    news: NewsEntry[];
}

export interface NewsBindings {
    news: NewsEntry[];
}
