import { RelativePattern, Uri, window, workspace, WorkspaceFolder } from "vscode";
import * as fs from "fs";
import { ALObject, parseObjects } from "../lib/parser";
import { getManifest } from "../lib/AppManifest";
import { Backend, ConsumptionInfo } from "../lib/Backend";
import { UI } from "../lib/UI";
import { ALWorkspace } from "../lib/ALWorkspace";
import { Authorization } from "../lib/Authorization";

async function getWorkspaceFolderFiles(uri: Uri): Promise<Uri[]> {
    let folderPath: string = uri.fsPath;
    let pattern = new RelativePattern(folderPath, "**/*.al");
    return await workspace.findFiles(pattern, null);
}

function getObjectDefinitions(uris: Uri[]): ALObject[] {
    let objects: ALObject[] = [];
    for (let uri of uris) {
        let file = fs.readFileSync(uri.fsPath).toString();
        objects.push(...parseObjects(file));
    }
    return objects;
}

function getConsumption(objects: ALObject[]): ConsumptionInfo {
    let consumption: ConsumptionInfo = {};
    for (let object of objects) {
        let { type, id } = object;
        if (!id) continue;
        if (!consumption[type]) consumption[type] = [];
        consumption[type].push(id);
    }
    return consumption;
}

/**
 * Synchronizes object ID consumption information with the Azure back end.
 * 
 * @param uri Uri of a document or a workspace folder for which to run the synchronization
 * @returns 
 */
export const syncObjectIds = async (uri?: Uri) => {
    uri = await ALWorkspace.selectWorkspaceFolder(uri);
    if (!uri) return;

    const uris = await getWorkspaceFolderFiles(uri);
    const objects = getObjectDefinitions(uris);
    const consumption: ConsumptionInfo = getConsumption(objects);
    const manifest = getManifest(uri); 

    if (!manifest) {
        UI.sync.showNoManifestError();
        return;
    }

    const key = Authorization.read(uri);
    if (await Backend.syncIds(manifest?.id, consumption, key?.key || "")) {
        UI.sync.showSuccessInfo();
    }
}
