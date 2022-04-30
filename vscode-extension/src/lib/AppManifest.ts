import { Uri, workspace } from "vscode";
import { AppIdCache } from "./AppIdCache";
import path = require("path");
import * as fs from "fs";
import { ALRange } from "./types";
import { PropertyBag } from "./PropertyBag";

const encryptionKeys: PropertyBag<string> = {};
const lastKnownNames: PropertyBag<string> = {};
const uriMap: PropertyBag<Uri> = {};
const manifestMap: PropertyBag<AppManifest> = {};
const manifestOriginalIds: PropertyBag<string> = {};

export interface AppManifest {
    encryptionKey: string;
    path: string,

    id: string;
    name: string;
    version: string;
    idRanges: ALRange[];
    preprocessorSymbols: string[];
}

interface AppManifestInternal extends AppManifest {
    idRange: ALRange;
}

export function getManifest(uri: Uri): AppManifest | null {
    const folder = workspace.getWorkspaceFolder(uri);
    if (!folder) return null;

    const appPath = path.join(folder.uri.fsPath, "app.json");
    try {
        const manifest = JSON.parse(fs.readFileSync(appPath).toString()) as AppManifestInternal;

        manifest.path = appPath;
        const encryptionKey = AppIdCache.instance.getAppIdHash(manifest.id.replace("-", ""));
        const originalId = manifest.id;
        manifest.id = AppIdCache.instance.getAppIdHash(manifest.id);
        manifestOriginalIds[manifest.id] = originalId;
        lastKnownNames[manifest.id] = manifest.name;
        uriMap[manifest.id] = uri;
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

export function getUriFromAppId(appId: string): Uri {
    return uriMap[appId];
}

function setAppEncryptionKey(appId: string, key: string) {
    if (encryptionKeys[appId]) {
        return;
    }

    const first = key[0];
    const numeric = parseInt(first, 16);
    encryptionKeys[appId] = key.substr(numeric, 32);
}

export function getAppEncryptionKey(appId: string): string {
    return encryptionKeys[appId];
}

export function getLastKnownAppName(appId: string): string {
    return lastKnownNames[appId];
}

export function getManifestFromAppId(appId: string): AppManifest {
    return manifestMap[appId];
}

export function getManifestOriginalId(appId: string): string {
    return manifestOriginalIds[appId];
}
