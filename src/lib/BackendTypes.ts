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

export interface EventLogEntry {
    eventType: string;
    timestamp: number;
    user: string;
    data: any;
}

export type ConsumptionInfoWithTotal = ConsumptionInfo | {
    _total: number;
}
