import { AzureFunction } from "@azure/functions";
import { Log } from "../../../common/LogCache";
import { RequestHandler } from "../../../common/RequestHandler";
import { RequestValidator } from "../../../common/RequestValidator";
import { BodyWithAppId } from "../../../common/types";

const httpTrigger: AzureFunction = RequestHandler.handleAuthorized<any, BodyWithAppId>(
    async (_, req) => {
        let { appId } = req.body;
        return Log.read(appId);
    },
    new RequestValidator([BodyWithAppId.validateAppId])
);

export default httpTrigger;
