import { Range, RequestBase } from "../../../common/types";
import { ALObjectType } from "../ALObjectType";

export interface GetNextSpecification {
    type: ALObjectType;
    count?: number;
    perRange?: boolean;
}

export interface GetNextResponseSegment {
    type: ALObjectType;
    range: Range;
    ids: number[];
    success: boolean;
}

export interface GetNextRequest extends RequestBase {
    ranges?: Range[];
    request: GetNextSpecification[];
}

export interface GetNextResponse {
    appId: string,
    response: GetNextResponseSegment[]
}

export interface GetNextBindings {
    ranges: Range[];
    ids: number[];
}
