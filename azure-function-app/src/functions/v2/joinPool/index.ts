import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { JoinPoolRequest, JoinPoolResponse } from "./types";
import { PoolUpdateManager } from "../PoolUpdateManager";

const joinPool = new ALNinjaRequestHandler<JoinPoolRequest, JoinPoolResponse>(async (request) => {
    const { poolId, joinKey, apps } = request.body;
    const updater = await PoolUpdateManager.create(poolId);
    return await updater.join(joinKey, apps);
}, false);

joinPool.skipAuthorization();
joinPool.validator.expect("body", {
    poolId: "string",
    joinKey: "string!",
    apps: "PoolApp[]",
});

export const disableJoinPoolRateLimit = () => joinPool.noRateLimit();

export const run = joinPool.azureFunction;
