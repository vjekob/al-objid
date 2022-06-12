import { PoolAppInfo } from "../TypesV2";

export interface CreatePoolResponse {
    poolId: string;
    accessKey: string;
    validationKey: string;
    managementKey?: string;
    leaveKeys: { [key: string]: string };
}

export interface CreatePoolRequest {
    name: string;
    managementSecret: string;
    joinKey: string;
    apps: PoolAppInfo[];
    allowAnyAppToManage: boolean;
}
