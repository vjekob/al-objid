import { ALObjectType } from "../../../common/ALObjectType";
import { AzureFunctionRequestHandler } from "../../../common/RequestHandler.v2";
import { Range } from "../../../common/types";

interface GetNextRequest {
    type: ALObjectType;
    ranges?: Range[];
    quantity?: number;
    fromRange?: Range;
}

interface GetNextResponse {
    type: ALObjectType;
    id: number | number[];
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

interface GetNextBindings {
    ranges: Range[];
    ids: number[];
}

const getNext = new AzureFunctionRequestHandler<GetNextRequest, GetNextResponse, GetNextBindings>(async (request, bindings) => {
    const { type } = request;

    return {
        type,
        id: 1,
        updated: false,
        available: true,
        updateAttempts: 0,
        hasConsumption: true,
    };
});

export default getNext.azureFunction;
