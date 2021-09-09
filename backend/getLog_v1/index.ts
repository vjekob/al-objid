import { AzureFunction } from "@azure/functions";
import { RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { BodyWithAppId, EventLogEntry } from "../common/types";

interface LogBindings {
    log: EventLogEntry[]
}

const httpTrigger: AzureFunction = RequestHandler.handle<LogBindings, any>(
    async (context) => context.bindings.log,
    new RequestValidator([BodyWithAppId.validateAppId])
);

export default httpTrigger;
