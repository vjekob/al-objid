import { BodyWithRanges, PoolReference } from "../../../common/types";
import { AzureFunction } from "@azure/functions";
import { ErrorResponse, RequestHandler } from "../../../common/RequestHandler";
import { RequestValidator } from "../../../common/RequestValidator";
import { BodyWithAppId } from "../../../common/types";
import { getSha256 } from "../../../common/util";
import { createAppPool, joinAppToPool } from "../../../common/updates";

interface CreatePoolBindings {
    pool: PoolReference;
}

interface CreatePoolBody extends BodyWithAppId, BodyWithRanges { }

const httpTrigger: AzureFunction = RequestHandler.handleAuthorized<CreatePoolBindings, CreatePoolBody>(
    async (context, req) => {
        const { pool } = context.bindings;
        if (pool && pool.poolId) {
            return new ErrorResponse("The app already belongs to a pool.", 409);
        }

        const { appId, ranges } = req.body;
        const poolId = getSha256(`POOL_ID_${req.body.appId}_${Date.now()}`, "hex");

        const promises: Promise<any>[] = [];
        promises.push(createAppPool(poolId, appId, ranges));
        promises.push(joinAppToPool(poolId, appId));
        await Promise.all(promises);

        return { poolId };
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
        BodyWithRanges.validateRanges,
    ])
);

export default httpTrigger;
