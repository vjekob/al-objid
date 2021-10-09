import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { ALObjectType } from "../ALObjectType";
import { DefaultBindings, DefaultRequest, ObjectConsumptions } from "../TypesV2";
import { ObjectConsumptionRequest } from "./types";
import { updateConsumptions } from "./update";

const syncIds = new ALNinjaRequestHandler<ObjectConsumptionRequest, ObjectConsumptions, DefaultBindings>(async (request) => {
    const { app } = request.bindings;
    const { appId, ids } = request.body;
    return await updateConsumptions(appId, ids, request.method === "PATCH");    
});
syncIds.validator.expect("body", {
    ids: "ObjectIDs"
});

export default syncIds.azureFunction;
