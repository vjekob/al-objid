import { PoolAppInfo } from "../TypesV2";

export interface LeavePoolAppInfo extends PoolAppInfo {
    leaveKey: string;
}

export interface LeavePoolRequest {
    poolId: string;
    accessKey: string;
    apps: LeavePoolAppInfo[]; 
}
