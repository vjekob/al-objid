import { ErrorResponse } from "@vjeko.com/azure-func";
import { findAvailablePerRange, findFirstAvailableId } from "../../../common/util";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { AppInfo, Range } from "../TypesV2";
import { GetNextRequest, GetNextResponse } from "./types";
import { updateConsumption } from "./update";

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
    for (let range of ranges) {
        if (id >= range.from && id <= range.to) {
            ownObject = true;
            break;
        }
    }

    if (ownObject) {
        ranges = [{ from: 1, to: 49999 }, ...ranges];
    }

    return ranges;
}

const limitRanges = (ranges: Range[], require?: number) => {
    if (typeof require !== "number") {
        return ranges;
    }

    for (let range of ranges) {
        if (require >= range.from && require <= range.to) {
            return [range];
        }
    }

    return [];
}

const getNext = new ALNinjaRequestHandler<GetNextRequest, GetNextResponse>(async (request) => {
    const appInfo: AppInfo = request.bindings.app || {} as AppInfo;
    const { appId, type, perRange, require } = request.body;
    const ids = appInfo[type] || [];
    const ranges = request.method === "POST" && perRange && require ? limitRanges(request.body.ranges, require) : request.body.ranges;
    const realRanges = getRealRanges(type, ranges);

    const result = {
        id: perRange ? findAvailablePerRange(realRanges, ids) : findFirstAvailableId(realRanges, ids),
        updated: false,
        available: false,
        updateAttempts: 0,
        hasConsumption: !!request.bindings.app
    };
    result.available = Array.isArray(result.id) ? result.id.length > 0 : result.id > 0;

    const updateContext = {
        id: Array.isArray(result.id) ? require : result.id,
        available: result.available,
        updated: false,
        updateAttempts: 0,
    };

    if (request.method === "POST" && (Array.isArray(result.id) ? result.id.length : result.id)) {
        const { app, success } = await updateConsumption(appId, request, type, realRanges, request.body.ranges, updateContext);
        if (!success) {
            throw new ErrorResponse("Too many attempts at updating BLOB", 409);
        }

        result.id = updateContext.id;
        result.available = updateContext.available;
        result.updated = updateContext.updated;
        result.hasConsumption = true;
        if (result.updated) {
            request.markAsChanged(appId, app);
        }
    }

    return result;
});

getNext.validator.expect("body", {
    ranges: "Range[]",
    type: "ALObjectType",
    "perRange?": "boolean",
    "require?": "number",
});

export const disableGetNextRateLimit = () => getNext.noRateLimit();

export const run = getNext.azureFunction;
