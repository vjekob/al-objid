import { PoolAppInfo } from "../TypesV2";

export interface GetPoolInfoRequest {
    poolId: string;
    accessKey: string;
}

export interface GetPoolInfoResponse {
    name: string;
    apps: PoolAppInfo[];
}
