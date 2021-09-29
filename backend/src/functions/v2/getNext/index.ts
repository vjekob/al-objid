import { AzureFunctionRequestHandler } from "../RequestHandler";
import { GetNextBindings, GetNextRequest, GetNextResponse } from "./types";

const getNext = new AzureFunctionRequestHandler<GetNextRequest, GetNextResponse, GetNextBindings>(async (request, bindings) => {
    const { type } = request;

    /*
        Expected input:
            {
                appId: string,
                [authKey: string,]
                ranges: Range | Range[],
                request: {
                    type: string,
                    count: number,
                    perRange: boolean;
                }[]
            }

        Output:
            {
                appId: string,
                response {
                    type: string,
                    range: Range,
                    ids: number[],
                    success: boolean, // Indicates whether the requested number of ids was successfully retrieved from the specified range
                }[]
            }

        Goals:
        1. Read everything from a single back-end file named `<appId>.json` (this means: authorization, ranges, consumption)
    */

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
