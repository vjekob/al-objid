import { RequestValidator } from "./../common/RequestValidator";
import { BodyWithAppId, BodyWithRanges, BodyWithType, Range, TypedContext } from "../common/types";
import { AzureFunction } from "@azure/functions";
import { areRangesEqual, findFirstAvailableId } from "../common/util";
import { ErrorResponse, RequestHandler } from "../common/RequestHandler";
import { updateConsumption, updateRanges } from "../common/updates";

type GetNextBindings = {
    ranges: Range[];
    ids: number[];
}

interface GetNextBody extends BodyWithRanges, BodyWithAppId, BodyWithType { };

async function retrieveBindings(context: TypedContext<GetNextBindings>, body: GetNextBody): Promise<GetNextBindings> {
    let { ranges, ids = [] } = context.bindings;
    if (!ranges || !areRangesEqual(ranges, body.ranges)) {
        ranges = await updateRanges(body.appId, body.ranges);
    }
    return { ranges, ids };
}

const httpTrigger: AzureFunction = RequestHandler.handle<GetNextBindings, GetNextBody>(
    async (context, req) => {
        const { ranges, ids } = await retrieveBindings(context, req.body);

        const result = {
            id: findFirstAvailableId(ranges, ids),
            updated: false,
            available: false,
            updateAttempts: 0,
            hasConsumption: !!context.bindings.ids
        }

        if (result.id && req.method === "POST") {
            const { appId, type } = req.body;
            let success = await updateConsumption(appId, type, ranges, result);
            if (!success) {
                return new ErrorResponse("Too many attempts at updating BLOB", 418);
            }
            result.hasConsumption = true;
        }

        result.available = result.id > 0;
        return result;
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
        BodyWithType.validateType,
        BodyWithRanges.validateRanges
    ])
);

export default httpTrigger;
