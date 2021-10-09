import { ALObjectType } from "../ALObjectType";
import { Range } from "../TypesV2";

export interface GetNextRequest {
    type: ALObjectType;
    ranges: Range[];
    count?: number;
    perRange?: boolean;
}

export interface GetNextResponse {
    id: number,
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

export interface ConsumptionUpdateContext {
    id: number;
    available: boolean;
    updated: boolean;
    updateAttempts: number;
}
