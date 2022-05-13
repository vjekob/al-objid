import { Uri } from "vscode";
import { Backend } from "../lib/backend/Backend";
import { UI } from "../lib/UI";
import { LogLevel, output } from "../features/Output";
import { ConsumptionInfo } from "../lib/types/ConsumptionInfo";
import { LABELS } from "../lib/constants";
import { getActualConsumption, getObjectDefinitions, getWorkspaceFolderFiles } from "../lib/ObjectIds";
import { Telemetry } from "../lib/Telemetry";
import { WorkspaceManager } from "../features/WorkspaceManager";

interface SyncOptions {
    merge: boolean;
    skipQuestion: boolean;
    uri: Uri;
}

/**
 * Synchronizes object ID consumption information with the Azure back end.
 */
export const syncObjectIds = async (options?: SyncOptions, appId?: string) => {
    const app = appId
        ? WorkspaceManager.instance.getALAppFromHash(appId)
        : await WorkspaceManager.instance.selectWorkspaceFolder(options?.uri);

    if (!app) {
        return;
    }

    let authKey = app.config.authKey;

    if (!options?.merge && !options?.skipQuestion) {
        let consumption = await Backend.getConsumption(app);
        if (consumption?._total) {
            let answer = await UI.sync.showAreYouSure();
            if (answer === LABELS.SYNC_ARE_YOU_SURE.NO) return;
        }
    }

    output.log("Starting syncing object ID consumption with the back end", LogLevel.Info);

    const uris = await getWorkspaceFolderFiles(app.uri);
    const objects = await getObjectDefinitions(uris);
    const consumption: ConsumptionInfo = getActualConsumption(objects);

    Telemetry.instance.log("syncIds", app.hash);
    if (await Backend.syncIds(app, consumption, !!options?.merge)) {
        UI.sync.showSuccessInfo(app);
    }
};
