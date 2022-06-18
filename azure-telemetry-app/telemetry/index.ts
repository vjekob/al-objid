import { RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryRequest } from "./types";
import { setup, defaultClient as client } from "applicationinsights";

setup(process.env.InsightsConnectionString);

const telemetry = new RequestHandler<TelemetryRequest>(async (request) => {
    const { userSha, appSha, event, context } = request.body;
    client.trackEvent({ name: event, properties: { user: userSha, app: appSha, ...context }});
});

export default telemetry.azureFunction;
