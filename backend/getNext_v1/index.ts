import { BodyWithAuthorization } from "./../common/types";
import { RequestValidator } from "./../common/RequestValidator";
import { BodyWithAppId, BodyWithRanges, BodyWithType, Range, TypedContext } from "../common/types";
import { AzureFunction } from "@azure/functions";
import { areRangesEqual, findFirstAvailableId } from "../common/util";
import { ErrorResponse, RequestHandler } from "../common/RequestHandler";
import { updateConsumption, updateRanges } from "../common/updates";
import { Log } from "../common/Log";

type GetNextBindings = {
    ranges: Range[];
    ids: number[];
}

interface GetNextBody extends BodyWithRanges, BodyWithAppId, BodyWithType, BodyWithAuthorization {
    content: any;
};

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
        result.available = result.id > 0;

        if (result.id && req.method === "POST") {
            const { appId, type, content } = req.body;
            let success = await updateConsumption(appId, type, ranges, result);
            if (!success) {
                return new ErrorResponse("Too many attempts at updating BLOB", 418);
            }

            if (content && result.available) {
                Log.logConsumption(appId, type, result.id, content);
            }
            result.hasConsumption = true;
        }

        return result;
    },
    new RequestValidator([
        BodyWithAppId.validateAppId,
        BodyWithType.validateType,
        BodyWithRanges.validateRanges
    ])
);

export default httpTrigger;
