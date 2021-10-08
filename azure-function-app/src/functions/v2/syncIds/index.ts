import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { ALObjectType } from "../ALObjectType";
import { DefaultBindings, DefaultRequest, ObjectConsumptions } from "../TypesV2";
import { ObjectConsumptionRequest } from "./types";

const syncIds = new ALNinjaRequestHandler<ObjectConsumptionRequest, ObjectConsumptions, DefaultBindings>(async (request) => {
    const { app } = request.bindings;
});
syncIds.validator.expect("body", {
    ids: 
})

export default syncIds.azureFunction;
