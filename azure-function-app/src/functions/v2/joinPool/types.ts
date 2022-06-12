import { PoolAppInfo } from "../TypesV2";

export interface JoinPoolRequest {
    poolId: string;
    joinKey: string;
    apps: PoolAppInfo[];
}

export interface JoinPoolResponse {
    accessKey: string;
    validationKey: string;
    managementKey?: string;
    leaveKeys: { [key: string]: string };
}
