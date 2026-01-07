import { Blob } from "@vjeko.com/azure-blob";
import { SingleAppHttpHandler, createEndpoint, validate, appRequestOptional } from "../../../http";
import { validateALObjectType } from "../../../utils";
import { logAppEvent } from "../../../utils/logging";
import { ActivityLogger } from "../../../activity";
import { AppInfo } from "../../../types";
import { createAddAssignmentUpdateCallback, createRemoveAssignmentUpdateCallback } from "./updateCallbacks";
import { AppCache } from "../../../cache";

interface StoreAssignmentResponse {
    updated: boolean;
}

interface UpdateResult {
    app: AppInfo;
    success: boolean;
}

async function addAssignment(blob: Blob<AppInfo>, type: string, id: number): Promise<UpdateResult> {
    const result = { success: true };

    const app = await blob.optimisticUpdate(
        createAddAssignmentUpdateCallback({ type, id }, result),
        {} as AppInfo
    );

    return { app, success: result.success };
}

async function removeAssignment(blob: Blob<AppInfo>, type: string, id: number): Promise<UpdateResult> {
    const app = await blob.optimisticUpdate(
        createRemoveAssignmentUpdateCallback({ type, id }),
        {} as AppInfo
    );

    return { app, success: true };
}

// POST - Add an assignment
// appId, type, id moved from body to route parameters
const post: SingleAppHttpHandler<void, StoreAssignmentResponse> = async (req) => {
    const { type, id } = req.params as { type: string; id: string };
    const idNum = parseInt(id);

    // Log activity for feature counting
    const ninjaAppId = req.headers.get("Ninja-App-Id");
    if (ninjaAppId) {
        try {
            await ActivityLogger.logActivity(ninjaAppId, req.user?.email || "", "addAssignment");
        } catch (err) {
            console.error("Activity logging failed:", err);
        }
    }

    const { app, success } = await addAssignment(req.appBlob, type, idNum);

    if (success) {
        AppCache.set(req.appId, app);

        // Log the addAssignment event
        await logAppEvent(req.appId, "addAssignment", req.user, { type, id: idNum });

        // Mark as changed to include _appInfo in response (v2 behavior)
        req.markAsChanged(app);
    }

    return { updated: success };
};

// POST to /delete - Remove an assignment (changed from DELETE to POST for REST compliance)
// appId, type, id moved from body to route parameters
// Pool signature is in the body
const postDelete: SingleAppHttpHandler<void, StoreAssignmentResponse> = async (req) => {
    const { type, id } = req.params as { type: string; id: string };
    const idNum = parseInt(id);

    // Log activity for feature counting
    const ninjaAppId = req.headers.get("Ninja-App-Id");
    if (ninjaAppId) {
        try {
            await ActivityLogger.logActivity(ninjaAppId, req.user?.email || "", "removeAssignment");
        } catch (err) {
            console.error("Activity logging failed:", err);
        }
    }

    const { app, success } = await removeAssignment(req.appBlob, type, idNum);

    if (success) {
        AppCache.set(req.appId, app);

        // Log the removeAssignment event
        await logAppEvent(req.appId, "removeAssignment", req.user, { type, id: idNum });

        // Mark as changed to include _appInfo in response (v2 behavior)
        req.markAsChanged(app);
    }

    return { updated: success };
};

// Custom validator for type parameter
const validateTypeParam = (req: any) => {
    const type = req.params?.type;
    const error = validateALObjectType(type);
    if (error) {
        return error;
    }
    return undefined;
};

// Custom validator for id parameter (must be a number)
const validateIdParam = (req: any) => {
    const id = req.params?.id;
    if (isNaN(parseInt(id))) {
        return "id must be a number";
    }
    return undefined;
};

validate(post, validateTypeParam, validateIdParam);
appRequestOptional(post);

validate(postDelete, validateTypeParam, validateIdParam);
appRequestOptional(postDelete);

// Main endpoint for adding assignments
export const storeAssignment = createEndpoint({
    moniker: "v3-storeAssignment",
    route: "v3/storeAssignment/{appId}/{type}/{id}",
    POST: post,
});

// Separate endpoint for removing assignments (REST-compliant alternative to DELETE with body)
export const storeAssignmentDelete = createEndpoint({
    moniker: "v3-storeAssignment-delete",
    route: "v3/storeAssignment/{appId}/{type}/{id}/delete",
    POST: postDelete,
});
