import { ALObjectType } from "./ALObjectType";

export interface Authorization {
    key: string;
    valid: boolean;
}

export interface Range {
    from: number;
    to: number;
}

export type ObjectConsumptions = {
    [key in ALObjectType]: number[];
}

export interface LogEntry {
    eventType: string;
    timestamp: number;
    user: string;
    data: any;
}

export type AppInfo = {
    _authorization: Authorization;
    _ranges: Range[];
    _log: LogEntry[];
} & ObjectConsumptions;

export interface AppBindings {
    app: AppInfo;
}

export interface DefaultBindings {};
export interface DefaultRequest {};
