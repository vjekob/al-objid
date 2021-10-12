import { RequestContext } from "@vjeko.com/azure-func";
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


export type ChangeOperation = "getNext" | "syncMerge" | "syncFull" | "authorize" | "deauthorize";

export interface ALNinjaRequestContext<TRequest = any, TBindings = any> extends RequestContext<TRequest, TBindings> {
    log(app: AppInfo, operation: ChangeOperation, content?: any): void;
    markAsChanged(appId: string, app: AppInfo): void;
}
