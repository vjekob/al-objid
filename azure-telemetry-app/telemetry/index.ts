import { RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryRequest } from "./types";
import { setup, defaultClient as client } from "applicationinsights";
import { lookup } from "fast-geoip";
import { getCountry } from "./getCountry";

const { InsightsConnectionString } = process.env;
setup(InsightsConnectionString);

const telemetry = new RequestHandler<TelemetryRequest>(async (request) => {
    const ipAddress = request.rawContext.req.headers["x-forwarded-for"] || "";
    let { country, region, city } = (await lookup(ipAddress)) || {};
    country = getCountry(country);

    let { userSha, appSha, event, context } = request.body;
    if (typeof context !== "object" || !context) {
        context = {
            data: context
        };
    }
    client.trackEvent({
        name: event,
        properties: { user: userSha, app: appSha, country, region, city, ...context, ipAddress }
    });
});

export default telemetry.azureFunction;
