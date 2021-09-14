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
