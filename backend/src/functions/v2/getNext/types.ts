import { ALObjectType } from "../ALObjectType";

export interface GetNextRequest {
    type: ALObjectType;
    ranges?: Range[];
    quantity?: number;
    fromRange?: Range;
}

export interface GetNextResponse {
    type: ALObjectType;
    id: number | number[];
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

export interface GetNextBindings {
    ranges: Range[];
    ids: number[];
}
