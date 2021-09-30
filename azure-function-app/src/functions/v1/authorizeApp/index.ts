import { BodyWithAuthorization } from "../../../common/types";
import { AzureFunction } from "@azure/functions";
import { RequestHandler } from "../RequestHandler";
import { ErrorResponse } from "../../../common/ErrorResponse";
import { RequestValidator } from "../RequestValidator";
import { BodyWithAppId } from "../../../common/types";
import { readAppAuthorization, removeAppAuthorization, writeAppAuthorization } from "../../../common/updates";
import { AuthorizationCache } from "../../../common/AuthorizationCache";

interface AuthorizeBody extends BodyWithAppId, BodyWithAuthorization { }

const httpTrigger: AzureFunction = RequestHandler.handle<any, AuthorizeBody>(
    async (_, req) => {
        let { appId, authKey } = req.body;

        let authorization = await readAppAuthorization(appId);
        switch (req.method) {
            case "POST":
                if (authorization.valid) {
                    return new ErrorResponse(`You cannot authorize app ${appId} because it is already authorized.`, 405);
                }
                authKey = await writeAppAuthorization(appId);
                AuthorizationCache.storeAuthorization(appId, authKey);
                return { authKey };
            case "DELETE":
                if (!authorization.valid) {
                    return new ErrorResponse(`You cannot de-authorize app ${appId} because it is not authorized.`, 405);
                }
                if (authKey !== authorization.key) {
                    return new ErrorResponse(`You cannot de-authorize app ${appId} because you provided the incorrect authorization key.`, 401);
                }
                const result = await removeAppAuthorization(appId);
                if (result) {
                    AuthorizationCache.storeAuthorization(appId, null);
                    return { deleted: true };
                }
                return new ErrorResponse(`An error occurred while de-authorizing app ${appId}. Try again later.`);
        }
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
    ])
)

export default httpTrigger;
