import { AzureFunction } from "@azure/functions";
import { ErrorResponse, RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { AppAuthorization, BodyWithAppId, BodyWithAuthorization, BodyWithObjectIds } from "../common/types";
import { updateConsumptions } from "../common/updates";

interface SyncIdsBody extends BodyWithAppId, BodyWithObjectIds, BodyWithAuthorization {};
interface SyncIdsBindings {
    authorization: AppAuthorization;
}

const httpTrigger: AzureFunction = RequestHandler.handle<SyncIdsBindings, SyncIdsBody>(
    async (context, req) => {
        const { appId, ids, authKey } = req.body;
        const { authorization } = context.bindings;

        if (authorization && authorization.valid && authorization.key != authKey) {
            return new ErrorResponse("You must provide a valid authorization key to access this endpoint.", 401);
        }
        return await updateConsumptions(appId, ids);
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
        BodyWithObjectIds.validateObjectIds,
    ])
);

export default httpTrigger;
