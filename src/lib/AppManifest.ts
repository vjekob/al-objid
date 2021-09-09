import { Uri, workspace } from "vscode";
import path = require("path");

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
        return require(appPath);
    }
    catch {
        return null;
    }
}
