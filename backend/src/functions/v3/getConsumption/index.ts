import { SingleAppHttpHandler, createEndpoint, appRequestMandatory } from "../../../http";
import { ObjectConsumptions, ALObjectType, AppInfo } from "../../../types";

type GetConsumptionResponse = ObjectConsumptions & { _total: number };

// POST - Get consumption data for an app (changed from GET to POST for REST compliance)
// appId moved from body to route parameter
const post: SingleAppHttpHandler<void, GetConsumptionResponse> = async (req) => {
    const { _authorization, _ranges, ...response } = req.app as AppInfo & GetConsumptionResponse;
    response._total = 0;
    for (const type of Object.values(ALObjectType)) {
        if (response[type]) {
            response._total += response[type].length;
        }
    }

    return response as GetConsumptionResponse;
};

appRequestMandatory(post);

export const getConsumption = createEndpoint({
    moniker: "v3-getConsumption",
    route: "v3/getConsumption/{appId}",
    POST: post,
});
