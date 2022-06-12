import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { RenamePoolRequest } from "./types";
import { PoolUpdateManager } from "../PoolUpdateManager";

const renamePool = new ALNinjaRequestHandler<RenamePoolRequest, void>(async (request) => {
    const { poolId, accessKey, name } = request.body;
    const updater = await PoolUpdateManager.create(poolId);
    await updater.rename(accessKey, name);
}, false);

renamePool.skipAuthorization();
renamePool.validator.expect("body", {
    poolId: "string!",
    accessKey: "string!",
    name: "string!",
});

export const disableRenamePoolRateLimit = () => renamePool.noRateLimit();

renamePool.requireManagementSignature();

export const run = renamePool.azureFunction;
