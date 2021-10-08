import { ALObjectType } from "../ALObjectType";
import { Range } from "../TypesV2";

export interface GetNextRequest {
    ranges: Range[];
    type: ALObjectType;
    count?: number;
    perRange?: boolean;
}

export interface GetNextResponse {
    appId: string,
    type: ALObjectType;
    range: Range;
    ids: number[];
    success: boolean;
}

export interface GetNextBindings {
    ranges: Range[];
    ids: number[];
}
