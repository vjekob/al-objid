import { AzureFunction } from "@azure/functions";
import { Blob } from "../common/Blob";
import { RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { BodyWithAppId, EventLogEntry } from "../common/types";
import { getBlobName } from "../common/updates";

const httpTrigger: AzureFunction = RequestHandler.handleAuthorized<any, BodyWithAppId>(
    async (_, req) => {
        let { appId } = req.body;
        let blob = new Blob<EventLogEntry[]>(getBlobName(appId, "_log"));
        let log = await blob.read() || [];
        return log;
    },
    new RequestValidator([BodyWithAppId.validateAppId])
);

export default httpTrigger;
