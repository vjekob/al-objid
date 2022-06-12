import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { RemovePoolRequest } from "./types";
import { PoolUpdateManager } from "../PoolUpdateManager";

const removePool = new ALNinjaRequestHandler<RemovePoolRequest, void>(async (request) => {
    const { poolId, deleteBlob } = request.body;
    const updater = await PoolUpdateManager.create(poolId);
    await updater.removePool(deleteBlob);
}, false);

removePool.skipAuthorization();
removePool.validator.expect("body", {
    poolId: "string!",
    "deleteBlob?": "boolean",
});

export const disableRemovePoolRateLimit = () => removePool.noRateLimit();

removePool.requireManagementSignature();

export const run = removePool.azureFunction;
