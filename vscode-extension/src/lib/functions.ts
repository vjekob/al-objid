import path = require("path");
import { commands, Uri } from "vscode";
import { getCachedManifestFromAppId } from "./AppManifest";
import { ALRange } from "./types";
import { UI } from "./UI";

export function showDocument(document: string) {
    commands.executeCommand("markdown.showPreview", Uri.file(path.join(__dirname, `../../docs/${document}.md`)));
}

export function getRangeForId<T extends ALRange>(id: number, ranges: T[]): T | undefined {
    for (let range of ranges) {
        if (id >= range.from && id <= range.to) {
            return range;
        }
    }
}

export function getPoolIdFromAppIdIfAvailable(appId: string): string {
    const manifest = getCachedManifestFromAppId(appId);
    const { appPoolId } = manifest.ninja.config;
    if (!appPoolId) {
        return appId;
    }

    if (appPoolId.length !== 64 || !/[0-9A-Fa-f]{6}/g.test(appPoolId)) {
        UI.pool.showInvalidAppPoolIdError(manifest);
        return appId;
    }

    return appPoolId;
}
