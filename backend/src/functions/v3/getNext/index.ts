import { Blob } from "@vjeko.com/azure-blob";
import { SingleAppHttpHandler, createEndpoint, validate, ErrorResponse, HttpStatusCode, optional, array, appRequestOptional } from "../../../http";
import { withPermissionCheck } from "../../../permission/withPermissionCheck";
import { findFirstAvailableId, findAvailablePerRange, validateALObjectType } from "../../../utils";
import { logAppEvent } from "../../../utils/logging";
import { ActivityLogger } from "../../../activity";
import { AppInfo, Range } from "../../../types";
import { createGetNextUpdateCallback, ConsumptionUpdateContext } from "./updateCallbacks";
import { AppCache } from "../../../cache";

interface GetNextRequest {
    type: string; // ALObjectType or extended type like "table_123"
    ranges: Range[];
    perRange?: boolean;
    require?: number;
    commit?: boolean; // New parameter: when true, commits the ID; when false/omitted, just returns the next available
}

interface GetNextResponse {
    id: number | number[];
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

const getRealRanges = (type: string, ranges: Range[]) => {
    if (!type.includes("_")) {
        return ranges;
    }

    const parts = type.split("_");
    if (parts[0].toLowerCase() === "tableextension") {
        return ranges;
    }

    const id = parseInt(parts[1]);
    let ownObject = false;
    for (const range of ranges) {
        if (id >= range.from && id <= range.to) {
            ownObject = true;
            break;
        }
    }

    if (ownObject) {
        ranges = [{ from: 1, to: 49999 }, ...ranges];
    }

    return ranges;
};

const limitRanges = (ranges: Range[], require?: number) => {
    if (typeof require !== "number") {
        return ranges;
    }

    for (const range of ranges) {
        if (require >= range.from && require <= range.to) {
            return [range];
        }
    }

    return [];
};

async function updateConsumption(
    blob: Blob<AppInfo>,
    type: string,
    assignFromRanges: Range[],
    appRanges: Range[],
    context: ConsumptionUpdateContext
): Promise<{ app: AppInfo; success: boolean }> {
    let success = true;

    const app = await blob.optimisticUpdate((app, attempts) => {
        if (attempts === 100) {
            success = false;
            return app;
        }
        return createGetNextUpdateCallback({ type, assignFromRanges, appRanges, context })(app, attempts);
    }, {} as AppInfo);

    return { app, success };
}

// POST - Get next available ID (changed from GET/POST to POST-only for REST compliance)
// appId moved from body to route parameter
// New `commit` parameter: when true commits the ID, when false just returns the next available
// Requires pool signature and source app ID match for pool operations
const post: SingleAppHttpHandler<GetNextRequest, GetNextResponse> = async (req) => {
    const { type, perRange, require, commit } = req.body;
    const bodyRanges = req.body.ranges;

    // Determine feature for activity logging
    const feature = commit ? "getNext_commit" : "getNext_check";

    // Log activity (use Ninja-App-Id header, not req.appId which is the SHA256 hash)
    const ninjaAppId = req.headers.get("Ninja-App-Id");
    if (ninjaAppId) {
        try {
            await ActivityLogger.logActivity(ninjaAppId, req.user?.email || "", feature);
        } catch (err) {
            console.error("Activity logging failed:", err);
        }
    }

    // TODO If the app is unknown, we should respond immediately with 404, we should not go further. The front end should interpret this correctly and it should not depend on `hasConsumption` flag for anything

    // Validate parameter combination: perRange + commit requires a valid require parameter
    if (perRange && commit && typeof require !== "number") {
        throw new ErrorResponse(
            "The 'require' parameter must be a valid number when 'perRange' is true and 'commit' is true",
            HttpStatusCode.ClientError_400_BadRequest
        );
    }

    const appInfo = req.app || {} as AppInfo;
    const hasConsumption = !!req.app;

    const ids = appInfo[type] || [];
    const ranges = commit && perRange && require ? limitRanges(bodyRanges, require) : bodyRanges;
    const realRanges = getRealRanges(type, ranges);

    const result: GetNextResponse = {
        id: perRange ? findAvailablePerRange(realRanges, ids) : findFirstAvailableId(realRanges, ids),
        updated: false,
        available: false,
        updateAttempts: 0,
        hasConsumption,
    };
    result.available = Array.isArray(result.id) ? result.id.length > 0 : result.id > 0;

    const updateContext: ConsumptionUpdateContext = {
        id: Array.isArray(result.id) ? require! : (result.id as number),
        available: result.available,
        updated: false,
        updateAttempts: 0,
    };

    // Only commit if commit is true and there's an ID to commit
    if (commit && (Array.isArray(result.id) ? result.id.length : result.id)) {
        const { app, success } = await updateConsumption(req.appBlob, type, realRanges, bodyRanges, updateContext);
        if (!success) {
            throw new ErrorResponse("Too many attempts at updating BLOB", HttpStatusCode.ClientError_409_Conflict);
        }

        AppCache.set(req.appId, app);

        result.id = updateContext.id;
        result.available = updateContext.available;
        result.updated = updateContext.updated;
        result.hasConsumption = true;

        // Log the getNext event if update occurred
        if (result.updated) {
            await logAppEvent(req.appId, "getNext", req.user, { type, id: updateContext.id });

            // Mark as changed to include _appInfo in response (v2 behavior)
            req.markAsChanged(app);
        }
    }

    return result;
};

validate(post, {
    type: validateALObjectType,
    ranges: array({
        from: "number",
        to: "number",
    }),
    perRange: optional("boolean"),
    require: optional("number"),
    commit: optional("boolean"),
});

appRequestOptional(post);
withPermissionCheck(post);

export const getNext = createEndpoint({
    moniker: "v3-getNext",
    route: "v3/getNext/{appId}",
    POST: post,
});
