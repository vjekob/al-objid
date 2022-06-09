import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { GetPoolInfoRequest, GetPoolInfoResponse } from "./types";
import { decrypt } from "../../../common/Encryption";
import { Blob, ErrorResponse } from "@vjeko.com/azure-func";
import { AppInfo } from "../TypesV2";

const getPoolInfo = new ALNinjaRequestHandler<GetPoolInfoRequest, GetPoolInfoResponse>(async (request) => {
    const { poolId, accessKey } = request.body;

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

    const decrypted = decrypt(app._pool.info, accessKey);
    if (!decrypted) {
        throw new ErrorResponse(`Invalid access key for pool ${poolId}.`, 401);
    }

    return JSON.parse(decrypted);
}, false);

getPoolInfo.skipAuthorization();
getPoolInfo.validator.expect("body", {
    poolId: "string",
    accessKey: "string",
});

export default getPoolInfo.azureFunction;
