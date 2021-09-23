import { AzureFunctionRequestHandler } from "../RequestHandler";
import { GetNextBindings, GetNextRequest, GetNextResponse } from "./types";

const getNext = new AzureFunctionRequestHandler<GetNextRequest, GetNextResponse, GetNextBindings>(async (request, bindings) => {
    const { type } = request;

    if (bindings) {
        //;
    }
    return {
        type,
        id: 1,
        updated: false,
        available: true,
        updateAttempts: 0,
        hasConsumption: true,
    };
});

getNext.bind("{appId}/_ranges.json").to("ranges");
getNext.bind("{appId}/{type}.json").to("ids");

getNext.validator.expect({
    type: "ALObjectType",
    ranges: "Range[]",
    "quantity?": "NonZeroNumber",
    "fromRange?": "Range",
});

export default getNext.azureFunction;
