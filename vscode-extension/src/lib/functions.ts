import path = require("path");
import { commands, DocumentSymbol, Position, Uri } from "vscode";
import { getCachedManifestFromAppId } from "./__AppManifest_obsolete_";
import { ALRange } from "./types";
import { UI } from "./UI";

function getBestMatch(
    checkSymbol: DocumentSymbol,
    bestMatch: DocumentSymbol | null
): DocumentSymbol {
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
    commands.executeCommand(
        "markdown.showPreview",
        Uri.file(path.join(__dirname, `../../docs/${document}.md`))
    );
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
