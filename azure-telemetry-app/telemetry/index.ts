import { RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryRequest } from "./types";
import { setup, defaultClient as client } from "applicationinsights";
import { lookup } from "fast-geoip";
import { getCountry } from "./getCountry";

const { InsightsConnectionString } = process.env;
setup(InsightsConnectionString);

const minimumVersion = [2, 9, 2];

function isSupportedVersion(version: string): boolean {
    if (!version) {
        // For old versions of Ninja, we don't log anything
        return;
    }

    const versionParts = version.split(".").map((part) => parseInt(part, 10));
    if (versionParts.length < 3) {
        // If version is not in format x.y.z, we don't log anything
        return;
    }

    for (let i = 0; i < 3; i++) {
        if (versionParts[i] > minimumVersion[i]) {
            return true;
        }
        
        if (versionParts[i] < minimumVersion[i]) {
            return false;
        }
    }

    return true;
}

const telemetry = new RequestHandler<TelemetryRequest>(async (request) => {
    const ipAddress = request.rawContext.req.headers["x-forwarded-for"] || "";
    let { country, region, city } = (await lookup(ipAddress)) || {};
    country = getCountry(country);

    let { userSha, appSha, event, context, version } = request.body;

    if (!isSupportedVersion(version)) {
        // For old versions of Ninja, we don't log anything
        return;
    }

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
