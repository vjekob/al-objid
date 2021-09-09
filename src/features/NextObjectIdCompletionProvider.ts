import { CancellationToken, commands, CompletionContext, CompletionItem, DocumentSymbol, Position, TextDocument, Uri, window } from "vscode";
import { EOL } from "os";
import { NextObjectIdCompletionItem } from "./NextObjectIdCompletionItem";
import { LABELS, OBJECT_TYPES } from "../lib/constants";
import { Backend, NextObjectIdInfo } from "../lib/Backend";
import { getManifest } from "../lib/AppManifest";
import { UI } from "../lib/UI";
import { Authorization } from "../lib/Authorization";
import { output } from "./Output";

type SymbolInfo = {
    type: string;
    id: string;
    name: string;
};

async function syncIfChosen(choice: Promise<string | undefined>) {
    if (await choice === LABELS.BUTTON_SYNCHRONIZE) {
        commands.executeCommand("vjeko-al-objid.sync-object-ids");
    }
}

async function getSymbolAtPosition(uri: Uri, position: Position): Promise<DocumentSymbol | null> {
    try {
        const symbols: DocumentSymbol[] = await commands.executeCommand("vscode.executeDocumentSymbolProvider", uri) as DocumentSymbol[];
        for (let symbol of symbols) {
            if (symbol.range.start.isBefore(position) && symbol.range.end.isAfter(position)) return symbol;
        }
    } catch { }
    return null;
}

async function getTypeAtPositionRaw(document: TextDocument, position: Position): Promise<string | null> {
    const symbol = await getSymbolAtPosition(document.uri, position);
    if (!symbol) {
        const line = document.lineAt(position.line).text.substring(0, position.character).trim();
        return line;
    };

    const match = symbol.name.match(/^(?<type>\w+)\s(?<id>\d+)\s(?<name>"?.+"?)?$/);
    if (match) {
        const { type, id } = match.groups as SymbolInfo;
        if (id !== "0") return null;

        const pos = position.translate(-symbol.range.start.line, position.line === symbol.range.start.line ? -symbol.range.start.character : 0);
        const lines = document.getText(symbol.range).split(EOL).slice(0, pos.line + 1);
        lines[lines.length - 1] = lines[lines.length - 1].substring(0, pos.character);
        const text = lines.join("").trim();
        if (text.toLowerCase() === type.toLowerCase()) return type;
    }
    return null;
}

async function getTypeAtPosition(document: TextDocument, position: Position): Promise<string | null> {
    let type = await getTypeAtPositionRaw(document, position);
    if (type === null) return null;

    type = type.toLowerCase();
    return OBJECT_TYPES.includes(type) ? type : null;
}

function showNotificationsIfNecessary(objectId?: NextObjectIdInfo): boolean {
    if (!objectId) return true;

    if (!objectId.hasConsumption) {
        syncIfChosen(UI.nextId.showNoBackEndConsumptionInfo());
        return true;
    }

    if (!objectId.available) {
        syncIfChosen(UI.nextId.showNoMoreNumbersWarning());
        return true;
    }

    return false;
}

export class NextObjectIdCompletionProvider {
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        const type = await getTypeAtPosition(document, position);
        if (!type) return;

        const manifest = getManifest(document.uri);
        if (!manifest) return;

        const key = Authorization.read(document.uri);
        const objectId = await Backend.getNextNo(manifest.id, type, manifest.idRanges, false, key?.key || "");

        if (showNotificationsIfNecessary(objectId) || !objectId) return [];
        output.log(`Suggesting object ID auto-complete for ${type} ${objectId.id}`);

        return [new NextObjectIdCompletionItem(type, objectId, manifest, position, document.uri)];
    }
}
