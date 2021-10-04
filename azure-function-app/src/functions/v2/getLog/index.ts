import { AzureFunction } from "@azure/functions";
import { Log } from "../../../common/LogCache";
import { RequestHandler } from "../../v1/RequestHandler";
import { RequestValidator } from "../../v1/RequestValidator";
import { BodyWithAppFolders } from "../../../common/types";
import { ErrorResponse } from "../../../common/ErrorResponse";

const httpTrigger: AzureFunction = RequestHandler.handleAppFoldersAuthorized<any, BodyWithAppFolders>(
    async (_, req) => {
        let result = [];
        for (let folder of req.body.appFolders) {
            result.push({
                appId: folder.appId,
                entries: Log.read(folder.appId),
            });
        }
        return result;
        // return new ErrorResponse("https://vjeko.com/", 503, { "Retry-After": "Sat, 9 Oct 2021 17:30:00 GMT" });
    },
    new RequestValidator([
        BodyWithAppFolders.validateAppFolders
    ])
);

export default httpTrigger;
