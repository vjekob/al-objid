import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { LeavePoolRequest } from "./types";
import { PoolUpdateManager } from "../PoolUpdateManager";

const leavePool = new ALNinjaRequestHandler<LeavePoolRequest, void>(async (request) => {
    const { poolId, joinKey, apps } = request.body;
    const updater = await PoolUpdateManager.create(poolId);
    await updater.leave(joinKey, apps);
}, false);

leavePool.skipAuthorization();
leavePool.validator.expect("body", {
    poolId: "string",
    joinKey: "string!",
    apps: "PoolApp[]",
});

export const disableLeavePoolRateLimit = () => leavePool.noRateLimit();

export const run = leavePool.azureFunction;
