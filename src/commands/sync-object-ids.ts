import { RelativePattern, Uri, window, workspace, WorkspaceFolder } from "vscode";
import * as fs from "fs";
import { ALObject, parseObjects } from "../lib/parser";
import { getManifest } from "../lib/AppManifest";
import { Backend, ConsumptionInfo } from "../lib/Backend";
import { UI } from "../lib/UI";
import { ALWorkspace } from "../lib/ALWorkspace";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { MeasureTime } from "../lib/MeasureTime";
import { Output, output } from "../features/Output";
import { Config } from "../lib/Config";

async function getWorkspaceFolderFiles(uri: Uri): Promise<Uri[]> {
    let folderPath: string = uri.fsPath;
    let pattern = new RelativePattern(folderPath, "**/*.al");
    return await workspace.findFiles(pattern, null);
}

function getObjectDefinitions(uris: Uri[]): ALObject[] {
    const objects: ALObject[] = [];
    const bestPractice = Config.instance.useBestPracticesParser;
    Output.instance.log(
        bestPractice
            ? "Using best-practices parser (this is slightly faster because it only looks for one object per file)"
            : "Using slower parser (this is slightly slower because it parses each file entirely looking for as many objects as it defines)"
    );
    for (let uri of uris) {
        let file = fs.readFileSync(uri.fsPath).toString();
        objects.push(...parseObjects(file, bestPractice));
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

    const manifest = getManifest(uri);

    if (!manifest) {
        UI.sync.showNoManifestError();
        return;
    }

    // Easter egg or cheating, call it what you want... but this is to prevent "creative" users from intentionally breaking the demo for others.
    if (manifest.id === "c454e488-56ca-4414-bd68-1d3a2548abf2") {
        UI.sandbox.showSandboxInfo("synchronized");
        return;
    }

    output.log("Starting syncing object ID consumption with the back end");

    MeasureTime.reset("loading", "parsing");

    MeasureTime.start("loading", "Retrieving list of workspace files");
    const uris = await getWorkspaceFolderFiles(uri);
    MeasureTime.stop("loading");

    MeasureTime.start("parsing", `Parsing ${uris.length} object files`)
    const objects = getObjectDefinitions(uris);
    MeasureTime.stop("parsing");

    MeasureTime.log("loading", "parsing");

    const consumption: ConsumptionInfo = getConsumption(objects);

    if (await Backend.syncIds(manifest?.id, consumption, ObjIdConfig.instance(uri).authKey || "")) {
        UI.sync.showSuccessInfo();
    }
}
