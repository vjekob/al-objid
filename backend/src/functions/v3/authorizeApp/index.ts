import {
    SingleAppHttpHandler,
    createEndpoint,
    ErrorResponse,
    HttpStatusCode,
    appRequestOptional,
    skipAuthorization,
    appRequestMandatory,
} from "../../../http";
import { withPermissionCheck } from "../../../permission/withPermissionCheck";
import { getSha256 } from "../../../utils";
import { logAppEvent } from "../../../utils/logging";
import { ActivityLogger } from "../../../activity";
import { AppInfo } from "../../../types";
import { createAuthorizeUpdateCallback, createDeauthorizeUpdateCallback } from "./updateCallbacks";
import { AppCache } from "../../../cache";

interface AuthorizeAppResponse {
    authorized?: boolean;
    authKey?: string;
    deleted?: boolean;
    valid?: boolean;
    user?: {
        name: string;
        email: string;
        timestamp: number;
    } | null;
}

// GET - Check authorization status
// authKey comes from Ninja-Auth-Key header
const get: SingleAppHttpHandler<void, AuthorizeAppResponse> = async req => {
    const authKey = req.headers.get("Ninja-Auth-Key");

    const result: AuthorizeAppResponse = {
        authorized: !!req.app?._authorization,
        user: req.app?._authorization?.user || null,
    };

    if (req.app?._authorization?.key) {
        result.valid = authKey === req.app._authorization.key;
    }

    return result;
};

// POST - Authorize an app
// User name/email come from Ninja-Git-Name and Ninja-Git-Email headers (bound automatically)
const post: SingleAppHttpHandler<void, AuthorizeAppResponse> = async req => {
    const userName = req.user?.name || "";
    const userEmail = req.user?.email || "";

    // Log activity (use Ninja-App-Id header, not req.appId which is the SHA256 hash)
    const ninjaAppId = req.headers.get("Ninja-App-Id");
    if (ninjaAppId) {
        try {
            await ActivityLogger.logActivity(ninjaAppId, userEmail, "authorizeApp");
        } catch (err) {
            console.error("Activity logging failed:", err);
        }
    }

    if (req.app?._authorization?.key) {
        throw new ErrorResponse(
            `You cannot authorize app ${req.appId} because it is already authorized.`,
            HttpStatusCode.ClientError_405_MethodNotAllowed
        );
    }

    const key = getSha256(`APP_AUTH_${req.appId}_${Date.now()}`, "base64");

    const updatedApp = await req.appBlob.optimisticUpdate(createAuthorizeUpdateCallback({ key, userName, userEmail }), {} as AppInfo);

    if (updatedApp) {
        AppCache.set(req.appId, updatedApp);
    }

    // Log the authorization event
    await logAppEvent(req.appId, "authorize", req.user);

    //TODO: Queue notification - old: request.markAsChanged(req.appId, app, app._authorization)

    return { authKey: updatedApp?._authorization?.key };
};

// DELETE - De-authorize an app
// authKey comes from Ninja-Auth-Key header
const del: SingleAppHttpHandler<void, AuthorizeAppResponse> = async req => {
    const authKey = req.headers.get("Ninja-Auth-Key");

    // Log activity (use Ninja-App-Id header, not req.appId which is the SHA256 hash)
    const ninjaAppId = req.headers.get("Ninja-App-Id");
    if (ninjaAppId) {
        try {
            await ActivityLogger.logActivity(ninjaAppId, req.user?.email || "", "deauthorizeApp");
        } catch (err) {
            console.error("Activity logging failed:", err);
        }
    }

    // Note: Auto-binding already ensures app exists, but we check authorization state
    if (!req.app._authorization?.key) {
        throw new ErrorResponse(
            `You cannot de-authorize app ${req.appId} because it is not authorized.`,
            HttpStatusCode.ClientError_405_MethodNotAllowed
        );
    }

    if (authKey !== req.app._authorization?.key) {
        throw new ErrorResponse(
            `You cannot de-authorize app ${req.appId} because you provided the incorrect authorization key.`,
            HttpStatusCode.ClientError_401_Unauthorized
        );
    }

    const app = await req.appBlob.optimisticUpdate(createDeauthorizeUpdateCallback(), req.app);

    if (!app?._authorization) {
        AppCache.set(req.appId, app);

        // Log the deauthorization event
        await logAppEvent(req.appId, "deauthorize", req.user);

        //TODO: Queue notification - old: request.markAsChanged(req.appId, app, app._authorization)
        return { deleted: true };
    }

    throw new ErrorResponse(
        `An error occurred while de-authorizing app ${req.appId}. Try again later.`,
        HttpStatusCode.ServerError_500_InternalServerError
    );
};

appRequestOptional(get);
appRequestOptional(post);
appRequestMandatory(del);

skipAuthorization(get);
skipAuthorization(post);
skipAuthorization(del);

withPermissionCheck(post);
withPermissionCheck(del);

export const authorizeApp = createEndpoint({
    moniker: "v3-authorizeApp",
    route: "v3/authorizeApp/{appId}",
    GET: get,
    POST: post,
    DELETE: del,
});
