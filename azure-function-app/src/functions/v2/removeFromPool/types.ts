import { PoolAppInfo } from "../TypesV2";

export interface RemoveFromPoolRequest {
    poolId: string;
    accessKey: string;
    apps: PoolAppInfo[]; 
}
