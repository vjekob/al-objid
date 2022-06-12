import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { RemoveFromPoolRequest } from "./types";
import { PoolUpdateManager } from "../PoolUpdateManager";

const removeFromPool = new ALNinjaRequestHandler<RemoveFromPoolRequest, void>(async (request) => {
    const { poolId, accessKey, apps } = request.body;
    const updater = await PoolUpdateManager.create(poolId);
    await updater.remove(accessKey, apps);
}, false);

removeFromPool.skipAuthorization();
removeFromPool.validator.expect("body", {
    poolId: "string",
    accessKey: "string!",
    apps: "PoolApp[]",
});

removeFromPool.requireManagementSignature();

export const disableRemoveFromPoolRateLimit = () => removeFromPool.noRateLimit();

export const run = removeFromPool.azureFunction;
