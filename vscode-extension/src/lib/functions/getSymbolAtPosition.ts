import { commands, DocumentSymbol, Position, Uri } from "vscode";
import { CodeCommand } from "../../commands/commands";

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
        if (symbol.range.start.isBeforeOrEqual(position) && symbol.range.end.isAfterOrEqual(position)) {
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
            CodeCommand.ExecuteDocumentSymbolProvider,
            uri
        )) as DocumentSymbol[];
        return getSymbolInChildren(position, symbols, null, matches);
    } catch {}
    return null;
}
