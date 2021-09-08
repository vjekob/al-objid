import { AppAuthorization, BodyWithAuthorization } from "./../common/types";
import { RequestValidator } from "./../common/RequestValidator";
import { BodyWithAppId, BodyWithRanges, BodyWithType, Range, TypedContext } from "../common/types";
import { AzureFunction } from "@azure/functions";
import { areRangesEqual, findFirstAvailableId } from "../common/util";
import { ErrorResponse, RequestHandler } from "../common/RequestHandler";
import { updateConsumption, updateRanges } from "../common/updates";

type GetNextBindings = {
    ranges: Range[];
    ids: number[];
    authorization?: AppAuthorization;
}

interface GetNextBody extends BodyWithRanges, BodyWithAppId, BodyWithType, BodyWithAuthorization { };

async function retrieveBindings(context: TypedContext<GetNextBindings>, body: GetNextBody): Promise<GetNextBindings> {
    let { ranges, ids = [], authorization } = context.bindings;
    if (!ranges || !areRangesEqual(ranges, body.ranges)) {
        ranges = await updateRanges(body.appId, body.ranges);
    }
    return { ranges, ids, authorization };
}

const httpTrigger: AzureFunction = RequestHandler.handle<GetNextBindings, GetNextBody>(
    async (context, req) => {
        const { ranges, ids, authorization } = await retrieveBindings(context, req.body);

        if (authorization && authorization.valid && authorization.key != req.body.authKey) {
            return new ErrorResponse("You must provide a valid authorization key to access this endpoint.", 401);
        }

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
