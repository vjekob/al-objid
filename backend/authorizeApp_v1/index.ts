import { BodyWithAuthorization } from './../common/types';
import { AzureFunction } from "@azure/functions";
import { ErrorResponse, RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { BodyWithAppId } from "../common/types";
import { readAppAuthorization, removeAppAuthorization, writeAppAuthorization } from "../common/updates";

interface AuthorizeBody extends BodyWithAppId, BodyWithAuthorization {}

const httpTrigger: AzureFunction = RequestHandler.handle<any, AuthorizeBody>(
    async (context, req) => {
        const { appId, authKey } = req.body;

        let authorization = await readAppAuthorization(appId);
        switch (req.method) {
            case "POST":
                if (authorization.valid) {
                    return new ErrorResponse(`You cannot authorize app ${appId} because it is already authorized.`, 405);
                }
                return {
                    authKey: await writeAppAuthorization(appId)
                }
            case "DELETE":
                if (!authorization.valid) {
                    return new ErrorResponse(`You cannot de-authorize app ${appId} because it is not authorized.`, 405);
                }
                if (authKey !== authorization.key) {
                    return new ErrorResponse(`You cannot de-authorize app ${appId} because you provided the incorrect authorization key.`, 401);
                }
                const result = await removeAppAuthorization(appId);
                return result ? { deleted: true } : new ErrorResponse(`An error occurred while de-authorizing app ${appId}. Try again later.`);
        }
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
    ])
)

export default httpTrigger;
