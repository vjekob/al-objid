import { Uri, workspace } from "vscode";
import { AppIdCache } from "./AppIdCache";
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
        const manifest = JSON.parse(fs.readFileSync(appPath).toString()) as AppManifest;
        manifest.id = AppIdCache.instance.getAppIdHash(manifest.id);
        return manifest;
    }
    catch {
        return null;
    }
}
