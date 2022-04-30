import { Uri, workspace } from "vscode";
import { AppIdCache } from "./AppIdCache";
import path = require("path");
import * as fs from "fs";
import { ALRange, AppManifest } from "./types";
import { PropertyBag } from "./PropertyBag";

const encryptionKeys: PropertyBag<string> = {};
const manifestMap: PropertyBag<AppManifest> = {};

interface AppManifestBackwardCompatibility extends AppManifest {
    idRange: ALRange;
}

export function getManifest(uri: Uri): AppManifest | null {
    const folder = workspace.getWorkspaceFolder(uri);
    if (!folder) return null;

    const appPath = path.join(folder.uri.fsPath, "app.json");
    try {
        const manifest = JSON.parse(fs.readFileSync(appPath).toString()) as AppManifestBackwardCompatibility;
        manifest.ninja = {
            unsafeOriginalId: manifest.id,
            uri,
            path: appPath
        };
        manifest.id = AppIdCache.instance.getAppIdHash(manifest.ninja.unsafeOriginalId);

        const encryptionKey = AppIdCache.instance.getAppIdHash(manifest.ninja.unsafeOriginalId.replace("-", ""));
        manifestMap[manifest.id] = manifest;

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
    encryptionKeys[appId] = key.substring(numeric, numeric + 32);
}

export function getAppEncryptionKey(appId: string): string {
    return encryptionKeys[appId];
}

export function getManifestFromAppId(appId: string): AppManifest {
    return manifestMap[appId];
}
