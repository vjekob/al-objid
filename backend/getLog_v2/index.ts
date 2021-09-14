import { AzureFunction } from "@azure/functions";
import { Log } from "../common/LogCache";
import { RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { BodyWithAppFolders, BodyWithAppId } from "../common/types";

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
    },
    new RequestValidator([
        BodyWithAppFolders.validateAppFolders
    ])
);

export default httpTrigger;
