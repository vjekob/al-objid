import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { JoinPoolRequest, JoinPoolResponse } from "./types";
import { decrypt, encrypt } from "../../../common/Encryption";
import { Blob, ErrorResponse } from "@vjeko.com/azure-func";
import { AppInfo, PoolInfo } from "../TypesV2";

const joinPool = new ALNinjaRequestHandler<JoinPoolRequest, JoinPoolResponse>(async (request) => {
    const { poolId, joinKey, apps } = request.body;

    const blob = new Blob<AppInfo>(`${poolId}.json`);
    let app: AppInfo;
    try {
        app = await blob.read();
        if (!app) {
            throw null;
        }
    } catch {
        throw new ErrorResponse(`Pool ${poolId} does not exist.`, 404);
    }

    if (!app._pool) {
        throw new ErrorResponse(`App ${poolId} is not a managed pool.`, 405);
    }

    const joinLockEncryptionKey = `${joinKey}${poolId}`.substring(0, 32);
    const { joinLock } = app._pool;
    const joinLockDecrypted = decrypt(joinLock, joinLockEncryptionKey);

    if (!joinLockDecrypted) {
        throw new ErrorResponse(`Invalid join key for pool ${poolId}.`, 401);
    }

    const checkPoolId = joinLockDecrypted.substring(0, 64);
    const accessKey = joinLockDecrypted.substring(64);

    if (checkPoolId !== poolId) {
        throw new ErrorResponse("Invalid pool information, you should not really see this error", 406);
    }

    const infoDecrypted = decrypt(app._pool.info, accessKey);
    if (!infoDecrypted) {
        throw new ErrorResponse(`Stale access key for pool ${poolId}. Please, ask the administrator to regenerate the join key.`, 401);
    };

    let info: PoolInfo;
    try {
        info = JSON.parse(infoDecrypted) as PoolInfo;
    } catch {
        throw new ErrorResponse("Invalid pool info content, you should not really see this error", 406);
    }

    for (let appNew of apps) {
        if (info.apps.some(app => app.appId === appNew.appId) || app._pool.appIds.includes(appNew.appId)) {
            throw new ErrorResponse(`App ${appNew.appId} is already included in pool ${poolId}`, 400);
        }
    }

    info.apps.push(...apps);
    const appIds: string[] = (app._pool.appIds || []);
    appIds.push(...apps.map(app => app.appId));

    await blob.optimisticUpdate(app => {
        app._pool.info = encrypt(JSON.stringify(info), accessKey);
        app._pool.appIds = appIds;
        return { ...app };
    });

    return {
        accessKey,
        validationKey: decrypt(app._pool.validationKey.private, joinLockEncryptionKey),
        managementKey: app._pool.managementKey.private
    };
}, false);

joinPool.skipAuthorization();
joinPool.validator.expect("body", {
    poolId: "string",
    joinKey: "string!",
    apps: "PoolApp[]",
});

export const disableJoinPoolRateLimit = () => joinPool.noRateLimit();

export const run = joinPool.azureFunction;
