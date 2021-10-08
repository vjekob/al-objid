import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { ALObjectType } from "../ALObjectType";
import { DefaultBindings, DefaultRequest } from "../TypesV2";
import { GetConsumptionResponse } from "./types";

const getConsumption = new ALNinjaRequestHandler<DefaultRequest, GetConsumptionResponse, DefaultBindings>(async (request) => {
    const { app } = request.bindings;
    const { _authorization, _ranges, ...response } = app as any;
    response._total = 0;
    for (let type of Object.values(ALObjectType)) {
        if (response[type]) {
            response._total += response[type].length;
        }
    }
    return response as GetConsumptionResponse;
});

export default getConsumption.azureFunction;
