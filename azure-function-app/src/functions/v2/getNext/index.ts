import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { ALObjectType } from "../ALObjectType";
import { migrateV1toV2 } from "./migrateV2";
import { GetNextBindings, GetNextRequest, GetNextResponse } from "./types";

const getNext = new ALNinjaRequestHandler<GetNextRequest, GetNextResponse, GetNextBindings>(async (request) => {
    /*
        Expected input:
            {
                appId: string,
                [authKey: string,]
                ranges: Range[],
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
                    type: ALObjectType,
                    range: Range,
                    ids: number[],
                    success: boolean, // Indicates whether the requested number of ids was successfully retrieved from the specified range
                }[]
            }

        Goals:
        1. Read everything from a single back-end file named `<appId>.json` (this means: authorization, ranges, consumption)
    */

    // if (bindings) {
    //     //;
    // }

    return {
        appId: "",
        response: [
            {
                type: ALObjectType.codeunit,
                range: { from: 50000, to: 50099 },
                ids: [50000],
                success: true
            }
        ]
    } as GetNextResponse
});

// getNext.validator.expect({
//     type: "ALObjectType",
//     ranges: "Range[]",
//     "quantity?": "NonZeroNumber",
//     "fromRange?": "Range",
// });

export default getNext.azureFunction;
