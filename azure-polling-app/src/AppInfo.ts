import { ALObjectType } from "./ALObjectType"

export type AppInfo = {
    [key in ALObjectType]: number[];
} & {
    _ranges: {
        from: number,
        to: number,
    }[];
    _log: any[];
};

export type AuthorizedAppInfo = {
    _authorization: {
        key: string;
        valid: boolean;
    };
    _timestamp: number;
} & AppInfo;
