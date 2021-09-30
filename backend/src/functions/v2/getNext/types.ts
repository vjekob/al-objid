import { ALObjectType } from "../ALObjectType";

export interface GetNextSpecification {
    type: ALObjectType;
    count?: number;
    perRange?: boolean;
}

export interface GetNextRequest {
    ranges?: Range[];
    request: GetNextSpecification[];
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
