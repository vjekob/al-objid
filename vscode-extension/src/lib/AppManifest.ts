import { Uri, workspace } from "vscode";
import { AppIdCache } from "./AppIdCache";
import path = require("path");
import * as fs from "fs";

const encryptionKeys: { [key: string]: string } = {};

export interface AppManifest {
    encryptionKey: string;
    id: string;
    name: string;
    version: string;
    idRanges: any[];
    idRange: {};
}

export function getManifest(uri: Uri): AppManifest | null {
    const folder = workspace.getWorkspaceFolder(uri);
    if (!folder) return null;

    const appPath = path.join(folder.uri.fsPath, "app.json");
    try {
        const manifest = JSON.parse(fs.readFileSync(appPath).toString()) as AppManifest;

        const encryptionKey = AppIdCache.instance.getAppIdHash(manifest.id.replace("-", ""));
        manifest.id = AppIdCache.instance.getAppIdHash(manifest.id);

        setAppEncryptionKey(manifest.id, encryptionKey);

        if (!manifest.idRanges && manifest.idRange) {
            manifest.idRanges = [manifest.idRange];
        }
        return manifest;
    }
    catch {
        return null;
    }
}

function setAppEncryptionKey(appId: string, key: string) {
    if (encryptionKeys[appId]) {
        return;
    }

    const first = key[0];
    const numeric = parseInt(first, 16);
    encryptionKeys[appId] = key.substr(numeric, 32);
}

export function getAppEncryptionKey(appId: string) {
    return encryptionKeys[appId];
}
