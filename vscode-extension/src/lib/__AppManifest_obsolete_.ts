import { Uri, workspace } from "vscode";
import { __AppIdCache_obsolete_ } from "./__AppIdCache_obsolete_";
import path = require("path");
import * as fs from "fs";
import { ALRange, __AppManifest_obsolete_ } from "./types";
import { PropertyBag } from "./PropertyBag";
import { __ObjIdConfig_obsolete_ } from "./__ObjIdConfig_obsolete_";

const encryptionKeys: PropertyBag<string> = {};
const manifestMap: PropertyBag<__AppManifest_obsolete_> = {};
const uriMap: WeakMap<Uri, __AppManifest_obsolete_> = new WeakMap();

interface AppManifestBackwardCompatibility extends __AppManifest_obsolete_ {
    idRange: ALRange;
}

export function getManifest(uri: Uri): __AppManifest_obsolete_ | null {
    const folder = workspace.getWorkspaceFolder(uri);
    if (!folder) return null;

    const folderUri = folder?.uri;

    const appPath = path.join(folder.uri.fsPath, "app.json");
    try {
        const manifest = JSON.parse(fs.readFileSync(appPath).toString()) as AppManifestBackwardCompatibility;
        manifest.ninja = {
            unsafeOriginalId: manifest.id,
            uri: folderUri,
            path: appPath,
            config: __ObjIdConfig_obsolete_.instance(folderUri, manifest.name),
        };
        manifest.id = __AppIdCache_obsolete_.instance.getAppIdHash(manifest.ninja.unsafeOriginalId);

        const encryptionKey = __AppIdCache_obsolete_.instance.getAppIdHash(
            manifest.ninja.unsafeOriginalId.replace("-", "")
        );

        setAppEncryptionKey(manifest.id, encryptionKey);

        if (!manifest.idRanges && manifest.idRange) {
            manifest.idRanges = [manifest.idRange];
        }

        manifestMap[manifest.id] = manifest;
        uriMap.set(uri, manifest);
        if (uri.fsPath !== folderUri.fsPath) {
            uriMap.set(folderUri, manifest);
        }
        return manifest;
    } catch {
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

export function getCachedManifestFromAppId(appId: string): __AppManifest_obsolete_ {
    return manifestMap[appId];
}
