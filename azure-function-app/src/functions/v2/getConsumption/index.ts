import { ErrorResponse } from "@vjeko.com/azure-func";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { ALObjectType } from "../ALObjectType";
import { DefaultRequest } from "../TypesV2";
import { GetConsumptionResponse } from "./types";

const getConsumption = new ALNinjaRequestHandler<DefaultRequest, GetConsumptionResponse>(async (request) => {
    const { app } = request.bindings;
    if (!app) {
        throw new ErrorResponse("App not found", 404);
    }
    
    const { _authorization, _ranges, ...response } = app as any;
    response._total = 0;
    for (let type of Object.values(ALObjectType)) {
        if (response[type]) {
            response._total += response[type].length;
        }
    }
    return response as GetConsumptionResponse;
});

getConsumption.requirePoolSignature();
getConsumption.requireSourceAppIdMatch();
export default getConsumption.azureFunction;
