import { ALObjectType } from "./ALObjectType";

export interface Authorization {
    key: string;
    valid: boolean;
}

export interface Range {
    from: number;
    to: number;
}

export type AppCache = {
    _authorization: Authorization;
    _ranges: Range[];
} & {
    [key in ALObjectType]: number[];
}
