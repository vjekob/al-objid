import { ALObjectType } from "../ALObjectType";

export interface StoreAssignmentRequest {
    type: ALObjectType;
    id: number;
}

export interface StoreAssignmentResponse {
    updated: boolean;
}
