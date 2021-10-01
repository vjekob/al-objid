export interface NextObjectIdInfo {
    id: number;
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

export interface ConsumptionInfo {
    [key: string]: number[];
}

export interface AuthorizationInfo {
    authKey: string;
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

export interface EventLogEntry {
    eventType: string;
    timestamp: number;
    user: string;
    data: any;
}

export interface FolderEventLogEntries {
    appId: string;
    entries: EventLogEntry[];
}

export type ConsumptionInfoWithTotal = ConsumptionInfo | {
    _total: number;
}

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
