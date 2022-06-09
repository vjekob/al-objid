import { PoolAppInfo } from "../TypesV2";

export interface CreatePoolResponse {
    poolId: string;
    accessKey: string;
    managementKey?: string;
}

export interface CreatePoolRequest {
    name: string;
    managementSecret: string;
    joinKey: string;
    apps: PoolAppInfo[];
    allowAnyAppToManage: boolean;
}
