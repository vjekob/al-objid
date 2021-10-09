import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { ObjectConsumptions } from "../TypesV2";
import { ObjectConsumptionRequest } from "./types";
import { updateConsumptions } from "./update";

const syncIds = new ALNinjaRequestHandler<ObjectConsumptionRequest, ObjectConsumptions>(async (request) => {
    const { app } = request.bindings;
    const { appId, ids } = request.body;
    const result = await updateConsumptions(appId, ids, request.method === "PATCH");
    request.markAsChanged(appId, app);
    return result;
});
syncIds.validator.expect("body", {
    ids: "ObjectIDs"
});

export default syncIds.azureFunction;
