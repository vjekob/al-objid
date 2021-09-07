import { QuickPickItem, RelativePattern, Uri, window, workspace, WorkspaceFolder } from "vscode";
import * as fs from "fs";
import { ALObject, parseObjects } from "../lib/parser";
import { getManifest } from "../lib/AppManifest";
import { Backend, ConsumptionInfo } from "../lib/Backend";
import { UI } from "../lib/UI";

interface WorkspaceFolderQuickPickItem extends QuickPickItem {
    uri: Uri;
}

type QuickPickResolve = (uri?: Uri) => void;

async function selectWorkspaceFolder(): Promise<Uri | undefined> {
    const workspaces = workspace.workspaceFolders;
    if (!workspaces) {
        UI.sync.showNoWorkspacesOpenInfo();
        return;
    }

    return new Promise((resolve: QuickPickResolve) => {
        const quickPick = window.createQuickPick<WorkspaceFolderQuickPickItem>();
        quickPick.placeholder = "Select the workspace folder..."
        quickPick.items = workspaces.map(w => ({
            label: w.name,
            detail: `$(folder) ${w.uri.fsPath}`,
            uri: w.uri
        }));
        quickPick.show();

        let resolved = false;
        let selectedFolder: WorkspaceFolderQuickPickItem | undefined;

        quickPick.onDidChangeSelection(selected => selectedFolder = selected.length ? selected[0] : undefined);
        quickPick.onDidAccept(() => {
            resolved = true;
            resolve(selectedFolder && selectedFolder.uri);
            quickPick.hide();
        });
        quickPick.onDidHide(() => {
            if (!resolved) resolve();
            quickPick.dispose();
        });
    });
}

async function getFolder(uri?: Uri): Promise<WorkspaceFolder | undefined> {
    if (!uri) uri = window.activeTextEditor?.document.uri;
    if (!uri) uri = await selectWorkspaceFolder();
    return uri && workspace.getWorkspaceFolder(uri);
}

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
    let folder = await getFolder(uri);
    if (!folder) return;

    const uris = await getWorkspaceFolderFiles(folder.uri);
    const objects = getObjectDefinitions(uris);
    const consumption: ConsumptionInfo = getConsumption(objects);
    const manifest = getManifest(folder.uri); 

    if (!manifest) {
        UI.sync.showNoManifestError();
        return;
    }

    if (await Backend.syncIds(manifest?.id, consumption)) {
        UI.sync.showSuccessInfo();
    }
}
