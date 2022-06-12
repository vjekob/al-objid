import { PoolAppInfo } from "../TypesV2";

export interface LeavePoolAppInfo extends PoolAppInfo {
    leaveKey: string;
}

export interface LeavePoolRequest {
    poolId: string;
    joinKey: string;
    apps: LeavePoolAppInfo[]; 
}
