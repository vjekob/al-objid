import { RequestContext } from "@vjeko.com/azure-func";
import { ALObjectType } from "./ALObjectType";

export interface Authorization {
    key: string;
    valid: boolean;
    user?: {
        name: string;
        email: string;
        timestamp: number;
    }
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

interface KeyPair {
    public: string;
    private: string;
}

export type AppInfo = {
    _authorization: Authorization;
    _ranges: Range[];
    _log: LogEntry[];
    _pool: {
        joinLock: string;
        info: string;
        appIds: string[];
        validationKey: KeyPair;
        managementKey: KeyPair;
        leaveKeys: { [key: string]: string };
    },
} & ObjectConsumptions;

export interface PoolAppInfo {
    appId: string;
    name: string;
}

export interface PoolInfo {
    name: string;
    apps: PoolAppInfo[];
}

export interface AppBindings {
    app: AppInfo;
}

export interface DefaultBindings { };
export interface DefaultRequest { };

export type ChangeOperation = "getNext" | "syncMerge" | "syncFull" | "authorize" | "deauthorize" | "addAssignment" | "removeAssignment";

export interface ALNinjaRequestContext<TRequest = any, TBindings = any> extends RequestContext<TRequest, TBindings> {
    log(app: AppInfo, operation: ChangeOperation, content?: any): void;
    markAsChanged(appId: string, app: AppInfo, authorization?: Authorization): void;
}
