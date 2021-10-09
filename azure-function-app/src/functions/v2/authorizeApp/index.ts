import { ErrorResponse } from "@vjeko.com/azure-func";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { DefaultBindings, DefaultRequest } from "../TypesV2";
import { AuthorizeAppResponse } from "./types";
import { removeAppAuthorization, writeAppAuthorization } from "./update";

const authorizeApp = new ALNinjaRequestHandler<DefaultRequest, AuthorizeAppResponse, DefaultBindings>(async (request) => {
    const { app } = request.bindings;
    let { appId, authKey } = request.body;

    switch (request.method) {
        case "POST":
            if (app?._authorization?.valid) {
                throw new ErrorResponse(`You cannot authorize app ${appId} because it is already authorized.`, 405);
            }
            authKey = await writeAppAuthorization(appId);
            return { authKey };

        case "DELETE":
            if (!app?._authorization?.valid) {
                throw new ErrorResponse(`You cannot de-authorize app ${appId} because it is not authorized.`, 405);
            }
            if (authKey !== app?._authorization?.key) {
                throw new ErrorResponse(`You cannot de-authorize app ${appId} because you provided the incorrect authorization key.`, 401);
            }
            const result = await removeAppAuthorization(appId);
            if (result) {
                return { deleted: true };
            }
            throw new ErrorResponse(`An error occurred while de-authorizing app ${appId}. Try again later.`);
    }
});

authorizeApp.skipAuthorization();

export default authorizeApp.azureFunction;
