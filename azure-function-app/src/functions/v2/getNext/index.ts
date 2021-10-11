import { ErrorResponse } from "@vjeko.com/azure-func";
import { findFirstAvailableId } from "../../../common/util";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { AppInfo } from "../TypesV2";
import { GetNextRequest, GetNextResponse } from "./types";
import { updateConsumption } from "./update";

const getNext = new ALNinjaRequestHandler<GetNextRequest, GetNextResponse>(async (request) => {
    const appInfo: AppInfo = request.bindings.app || {} as AppInfo;
    const { appId, ranges, type } = request.body;
    const ids = appInfo[type] || [];

    const result = {
        id: findFirstAvailableId(ranges, ids),
        updated: false,
        available: false,
        updateAttempts: 0,
        hasConsumption: !!request.bindings.app
    };
    result.available = result.id > 0;

    if (result.id && request.method === "POST") {
        const { app, success } = await updateConsumption(appId, type, ranges, result);
        if (!success) {
            throw new ErrorResponse("Too many attempts at updating BLOB", 409);
        }
        result.hasConsumption = true;
        request.markAsChanged(appId, app, "getNext", { type, id: result.id });
    }

    return result;
});

getNext.validator.expect("body", {
    ranges: "Range[]",
    type: "ALObjectType",
    "count?": "number",
    "perRange?": "boolean"
});

export default getNext.azureFunction;
