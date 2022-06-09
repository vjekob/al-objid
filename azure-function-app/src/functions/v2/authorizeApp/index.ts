import { ErrorResponse } from "@vjeko.com/azure-func";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { AuthorizeAppRequest, AuthorizeAppResponse } from "./types";
import { removeAppAuthorization, writeAppAuthorization } from "./update";

const authorizeApp = new ALNinjaRequestHandler<AuthorizeAppRequest, AuthorizeAppResponse>(async (request) => {
    const { app } = request.bindings;
    let { appId, authKey, gitUser, gitEMail } = request.body;

    switch (request.method) {
        case "GET":
            const result = {
                authorized: !!app?._authorization || !!app?._pool,
                user: app?._authorization?.user || null,
            } as AuthorizeAppResponse;
            if (app?._authorization?.key) {
                result.valid = authKey === app?._authorization?.key;
            }
            return result;

        case "POST":
            if (app?._authorization?.valid) {
                throw new ErrorResponse(`You cannot authorize app ${appId} because it is already authorized.`, 405);
            }
            const writeResult = await writeAppAuthorization(appId, gitUser, gitEMail, request);
            authKey = writeResult.app._authorization.key;

            request.markAsChanged(appId, writeResult.app, writeResult.app._authorization);
            return { authKey };

        case "DELETE":
            if (!app) {
                throw new ErrorResponse(`You cannot de-authorize app ${appId} because it does not exist.`, 404);
            }
            if (!app._authorization?.valid) {
                throw new ErrorResponse(`You cannot de-authorize app ${appId} because it is not authorized.`, 405);
            }
            if (authKey !== app._authorization?.key) {
                throw new ErrorResponse(`You cannot de-authorize app ${appId} because you provided the incorrect authorization key.`, 401);
            }
            const removeResult = await removeAppAuthorization(appId, request);
            if (removeResult.success) {
                request.markAsChanged(appId, removeResult.app, removeResult.app._authorization);
                return { deleted: true };
            }
            throw new ErrorResponse(`An error occurred while de-authorizing app ${appId}. Try again later.`);
    }
});

authorizeApp.skipAuthorization();
authorizeApp.notForPools("DELETE", "POST");

export const disableAuthorizeAppRateLimit = () => authorizeApp.noRateLimit();

export const run = authorizeApp.azureFunction;
