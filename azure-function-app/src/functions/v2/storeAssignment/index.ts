import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { AppInfo } from "../TypesV2";
import { StoreAssignmentRequest, StoreAssignmentResponse } from "./types";
import { addAssignment, removeAssignment } from "./update";

const storeAssignment = new ALNinjaRequestHandler<StoreAssignmentRequest, StoreAssignmentResponse>(async (request) => {
    const { appId, type, id } = request.body;

    let app: AppInfo, success: boolean = false;

    switch (request.method) {
        case "POST":
            const addResult = await addAssignment(appId, request, type, id);
            app = addResult.app;
            success = addResult.success;
            break;

        case "DELETE":
            const removeResult = await removeAssignment(appId, request, type, id);
            app = removeResult.app;
            success = removeResult.success;
            break;
    }

    if (success) {
        request.markAsChanged(appId, app);
    }

    return {
        updated: success
    };
});

storeAssignment.validator.expect("body", {
    type: "ALObjectType",
    "id": "number",
});
storeAssignment.requirePoolSignature();
storeAssignment.requireSourceAppIdMatch();

export const disableStoreAssignmentRateLimit = () => storeAssignment.noRateLimit();

export const run = storeAssignment.azureFunction;
