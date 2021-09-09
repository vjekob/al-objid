import { Uri, workspace } from "vscode";
import path = require("path");
import * as fs from "fs";

export interface AppManifest {
    id: string;
    name: string;
    version: string;
    idRanges: any[];
}

export function getManifest(uri: Uri): AppManifest | null {
    const folder = workspace.getWorkspaceFolder(uri);
    if (!folder) return null;

    const appPath = path.join(folder.uri.fsPath, "app.json");
    try {
        return JSON.parse(fs.readFileSync(appPath).toString()) as AppManifest;
    }
    catch {
        return null;
    }
}
