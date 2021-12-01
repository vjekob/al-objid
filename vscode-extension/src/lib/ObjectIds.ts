import { RelativePattern, Uri, workspace } from "vscode";
import { ConsumptionInfo } from "./BackendTypes";
import { executeWithStopwatchAsync } from "./MeasureTime";
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { ParserConnector } from "../features/ParserConnector";

export async function getWorkspaceFolderFiles(uri: Uri): Promise<Uri[]> {
    let folderPath: string = uri.fsPath;
    let pattern = new RelativePattern(folderPath, "**/*.al");
    return await executeWithStopwatchAsync(() => workspace.findFiles(pattern, null), `Retrieving list of files in ${uri}`);
}

export async function getObjectDefinitions(uris: Uri[]): Promise<ALObject[]> {
    return executeWithStopwatchAsync(() => ParserConnector.instance.parse(uris), `Parsing ${uris.length} object files`);
}

export function updateActualConsumption(objects: ALObject[], consumption: ConsumptionInfo): void {
    for (let object of objects) {
        let { type, id } = object;
        if (!id) continue;
        if (!consumption[type]) consumption[type] = [];
        consumption[type].push(id);
    }
}

export function getActualConsumption(objects: ALObject[]): ConsumptionInfo {
    const consumption: ConsumptionInfo = {};
    updateActualConsumption(objects, consumption);
    return consumption;
}
