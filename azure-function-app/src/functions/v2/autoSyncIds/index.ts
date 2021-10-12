import { Blob, ErrorResponse } from "@vjeko.com/azure-func";
import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { updateConsumptions } from "../syncIds/update";
import { AppInfo } from "../TypesV2";
import { AutoSyncIdsRequest, AutoSyncIdsResponse } from "./types";

const autoSyncIds = new ALNinjaRequestHandler<AutoSyncIdsRequest, AutoSyncIdsResponse>(async (request) => {
    const { appFolders } = request.body;
    let result: AutoSyncIdsResponse = {};
    for (let folder of appFolders) {
        const blob = new Blob<AppInfo>(`${folder.appId}.json`);
        const app = await blob.read();
        if (app && app._authorization && app._authorization.valid && app._authorization.key !== folder.authKey) {
            throw new ErrorResponse(`Invalid credentials for app ${folder.appId}`, 401);
        }
        result[folder.appId] = await updateConsumptions(folder.appId, request, folder.ids, request.method === "PATCH");
    }
    return result;
}, false);

autoSyncIds.skipAuthorization();
autoSyncIds.validator.expect("body", {
    appFolders: "PerAppObjectIDs"
});

export default autoSyncIds.azureFunction;
