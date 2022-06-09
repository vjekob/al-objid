import { PoolAppInfo } from "../TypesV2";

export interface JoinPoolRequest {
    poolId: string;
    joinKey: string;
    apps: PoolAppInfo[]; 
}

export interface JoinPoolResponse {
    accessKey: string;
    managementKey?: string;
}
