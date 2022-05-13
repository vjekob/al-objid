import path = require("path");
import { commands, DocumentSymbol, Position, Uri } from "vscode";
import { ALRange } from "./types";
import { UI } from "./UI";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { ALApp } from "./ALApp";

function getBestMatch(checkSymbol: DocumentSymbol, bestMatch: DocumentSymbol | null): DocumentSymbol {
    if (!bestMatch) {
        return checkSymbol;
    }
    return checkSymbol.range.start.isAfterOrEqual(bestMatch.range.start) &&
        checkSymbol.range.end.isBeforeOrEqual(bestMatch.range.end)
        ? checkSymbol
        : bestMatch;
}

function getSymbolInChildren(
    position: Position,
    symbols: DocumentSymbol[],
    bestMatch: DocumentSymbol | null,
    matches: DocumentSymbol[]
): DocumentSymbol | null {
    for (let symbol of symbols) {
        if (symbol.range.start.isBefore(position) && symbol.range.end.isAfter(position)) {
            matches.push(symbol);
            bestMatch = getBestMatch(symbol, bestMatch);
        }
    }
    for (let symbol of symbols) {
        if (!symbol.children || !symbol.children.length) continue;
        let result = getSymbolInChildren(position, symbol.children, bestMatch, matches);
        if (result) {
            bestMatch = getBestMatch(result, bestMatch);
        }
    }
    return bestMatch;
}

export async function getSymbolAtPosition(
    uri: Uri,
    position: Position,
    matches?: DocumentSymbol[]
): Promise<DocumentSymbol | null> {
    if (!matches) {
        matches = [];
    }
    try {
        const symbols: DocumentSymbol[] = (await commands.executeCommand(
            "vscode.executeDocumentSymbolProvider",
            uri
        )) as DocumentSymbol[];
        return getSymbolInChildren(position, symbols, null, matches);
    } catch {}
    return null;
}

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

// TODO Move this function to WorkspaceManager
export function getPoolIdFromAppIdIfAvailable(appId: string): string {
    const app = WorkspaceManager.instance.getALAppFromHash(appId);
    if (!app) {
        return appId;
    }
    const { appPoolId } = app.config;
    if (!appPoolId) {
        return appId;
    }

    if (appPoolId.length !== 64 || !/[0-9A-Fa-f]{6}/g.test(appPoolId)) {
        UI.pool.showInvalidAppPoolIdError(app);
        return appId;
    }

    return appPoolId;
}

/**
 * Retrieves a properly delimited app names from an ALApp array.
 * @param apps ALApp array to extract names from
 * @returns String containing list of app names properly delimited
 */
export function getAppNames(apps: ALApp[]) {
    switch (apps.length) {
        case 1:
            return apps[0].manifest.name;
        case 2:
            return apps.map(app => app.manifest.name).join(" and ");
        default:
            return `${apps
                .slice(0, apps.length - 1)
                .map(app => app.manifest.name)
                .join(", ")}, and ${apps[apps.length - 1].manifest.name}`;
    }
}
