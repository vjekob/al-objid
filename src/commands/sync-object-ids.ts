import { RelativePattern, Uri, workspace } from "vscode";
import * as fs from "fs";
import { ALObject, parseObjects } from "../lib/parser";
import { getManifest } from "../lib/AppManifest";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { ALWorkspace } from "../lib/ALWorkspace";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { MeasureTime } from "../lib/MeasureTime";
import { Output, output } from "../features/Output";
import { Config } from "../lib/Config";
import { ConsumptionInfo } from "../lib/BackendTypes";
import { LABELS } from "../lib/constants";

interface SyncOptions {
    merge: boolean,
    skipQuestion: boolean,
    uri: Uri,
}

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

function getActualConsumption(objects: ALObject[]): ConsumptionInfo {
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
 * @param patch Flag that indicates whether patching (merge) rather than full replace should be done
 * @param uri Uri of a document or a workspace folder for which to run the synchronization
 * @returns 
 */
export const syncObjectIds = async (options?: SyncOptions) => {
    let uri = await ALWorkspace.selectWorkspaceFolder(options?.uri);
    if (!uri) return;

    const manifest = getManifest(uri);

    if (!manifest) {
        UI.sync.showNoManifestError();
        return;
    }

    let authKey = ObjIdConfig.instance(uri).authKey;

    if (!options?.merge) {
        let consumption = await Backend.getConsumption(manifest!.id, authKey);
        if (consumption?._total) {
            let answer = await UI.sync.showAreYouSure();
            if (answer === LABELS.SYNC_ARE_YOU_SURE.NO) return;
        }
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

    const consumption: ConsumptionInfo = getActualConsumption(objects);

    if (await Backend.syncIds(manifest?.id, consumption, !!(options?.merge), ObjIdConfig.instance(uri).authKey || "")) {
        UI.sync.showSuccessInfo();
    }
}
