import { RelativePattern, Uri, workspace } from "vscode";
import { Output } from "../features/Output";
import { Config } from "./Config";
import { ALObject, parseObjects } from "./parser";
import { ConsumptionInfo } from "./BackendTypes";
import { executeWithStopwatch, executeWithStopwatchAsync } from "./MeasureTime";
import * as fs from "fs";

export async function getWorkspaceFolderFiles(uri: Uri): Promise<Uri[]> {
    let folderPath: string = uri.fsPath;
    let pattern = new RelativePattern(folderPath, "**/*.al");
    return await executeWithStopwatchAsync(() => workspace.findFiles(pattern, null), `Retrieving list of files in ${uri}`);
}

export function getObjectDefinitions(uris: Uri[]): ALObject[] {
    return executeWithStopwatch(() => {
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
    }, `Parsing ${uris.length} object files`);
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
