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

export type AppCache = {
    _authorization: Authorization;
    _ranges: Range[];
} & ObjectConsumptions;

export interface AppBindings {
    app: AppCache;
}

export interface DefaultBindings {};
export interface DefaultRequest {};
