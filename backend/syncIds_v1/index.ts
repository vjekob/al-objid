import { AzureFunction } from "@azure/functions"
import { RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { BodyWithAppId, BodyWithObjectIds } from "../common/types";
import { updateConsumptions } from "../common/updates";

interface SyncIdsBody extends BodyWithAppId, BodyWithObjectIds {};

const httpTrigger: AzureFunction = RequestHandler.handle<any, SyncIdsBody>(
    async (context, req) => {
        const { appId, ids } = req.body;
        return await updateConsumptions(appId, ids);
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
        BodyWithObjectIds.validateObjectIds,
    ])
);

export default httpTrigger;
