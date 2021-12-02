import { ErrorResponse } from "@vjeko.com/azure-func";
import { findFirstAvailableId } from "../../../common/util";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { AppInfo, Range } from "../TypesV2";
import { GetNextRequest, GetNextResponse } from "./types";
import { updateConsumption } from "./update";

const getRealRanges = (type: string, ranges: Range[]) => {
    if (!type.includes("_")) {
        return ranges;
    }

    const parts = type.split("_");
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

const getNext = new ALNinjaRequestHandler<GetNextRequest, GetNextResponse>(async (request) => {
    const appInfo: AppInfo = request.bindings.app || {} as AppInfo;
    const { appId, ranges, type } = request.body;
    const ids = appInfo[type] || [];
    const realRanges = getRealRanges(type, ranges);

    const result = {
        id: findFirstAvailableId(realRanges, ids),
        updated: false,
        available: false,
        updateAttempts: 0,
        hasConsumption: !!request.bindings.app
    };
    result.available = result.id > 0;

    if (result.id && request.method === "POST") {
        const { app, success } = await updateConsumption(appId, request, type, realRanges, ranges, result);
        if (!success) {
            throw new ErrorResponse("Too many attempts at updating BLOB", 409);
        }
        result.hasConsumption = true;
        request.markAsChanged(appId, app);
    }

    return result;
});

getNext.validator.expect("body", {
    ranges: "Range[]",
    type: "ALObjectType",
    "count?": "number",
    "perRange?": "boolean"
});

export const disableGetNextRateLimit = () => getNext.noRateLimit();

export default getNext.azureFunction;
