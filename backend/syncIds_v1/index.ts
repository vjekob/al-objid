import { AzureFunction } from "@azure/functions";
import { ErrorResponse, RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { AppAuthorization, BodyWithAppId, BodyWithAuthorization, BodyWithObjectIds, SANDBOX_ID } from "../common/types";
import { updateConsumptions } from "../common/updates";

interface SyncIdsBody extends BodyWithAppId, BodyWithObjectIds, BodyWithAuthorization {};
interface SyncIdsBindings {
    authorization: AppAuthorization;
}

const httpTrigger: AzureFunction = RequestHandler.handle<SyncIdsBindings, SyncIdsBody>(
    async (context, req) => {
        const { appId, ids } = req.body;

        if (appId === SANDBOX_ID) {
            return new ErrorResponse("Nice try 😁", 418);
        }

        return await updateConsumptions(appId, ids);
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
        BodyWithObjectIds.validateObjectIds,
    ])
);

export default httpTrigger;
