import { CancellationToken, commands, CompletionContext, DocumentSymbol, env, Position, TextDocument, Uri } from "vscode";
import { EOL } from "os";
import { NextObjectIdCompletionItem } from "./NextObjectIdCompletionItem";
import { LABELS, OBJECT_TYPES, URLS } from "../lib/constants";
import { Backend } from "../lib/Backend";
import { AppManifest, getManifest } from "../lib/AppManifest";
import { UI } from "../lib/UI";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { output } from "./Output";
import { NextObjectIdInfo } from "../lib/BackendTypes";
import { PropertyBag } from "../lib/PropertyBag";
import { Telemetry } from "../lib/Telemetry";
import { NextIdContext, ParserConnector } from "./ParserConnector";

type SymbolInfo = {
    type: string;
    id: string;
    name: string;
};

let syncDisabled: PropertyBag<boolean> = {};
let syncSkipped = 0;
let stopAsking = false;

async function syncIfChosen(manifest: AppManifest, choice: Promise<string | undefined>) {
    switch (await choice) {
        case LABELS.BUTTON_SYNCHRONIZE:
            commands.executeCommand("vjeko-al-objid.sync-object-ids", {
                skipQuestion: true
            });
            break;
        case LABELS.BUTTON_LEARN_MORE:
            Telemetry.instance.log("docs.learnExtension");
            env.openExternal(Uri.parse(URLS.EXTENSION_LEARN));
            break;
        default:
            syncDisabled[manifest.id] = true;
            if (++syncSkipped > 1) {
                if (await UI.nextId.showNoBackEndConsumptionInfoAlreadySaidNo() === LABELS.BUTTON_DONT_ASK) {
                    stopAsking = true;
                }
            }
            break;
    }
}

function getBestMatch(checkSymbol: DocumentSymbol, bestMatch: DocumentSymbol | null): DocumentSymbol {
    if (!bestMatch) {
        return checkSymbol;
    }
    return checkSymbol.range.start.isAfterOrEqual(bestMatch.range.start) && checkSymbol.range.end.isBeforeOrEqual(bestMatch.range.end)
        ? checkSymbol
        : bestMatch;
}

function getSymbolInChildren(position: Position, symbols: DocumentSymbol[], bestMatch: DocumentSymbol | null, matches: DocumentSymbol[]): DocumentSymbol | null {
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
        };
    }
    return bestMatch;
}

async function getSymbolAtPosition(uri: Uri, position: Position, matches: DocumentSymbol[]): Promise<DocumentSymbol | null> {
    try {
        const symbols: DocumentSymbol[] = await commands.executeCommand("vscode.executeDocumentSymbolProvider", uri) as DocumentSymbol[];
        return getSymbolInChildren(position, symbols, null, matches);
    } catch { }
    return null;
}

function isTableOrEnum(type: string) {
    return (type.startsWith("table_") || type.startsWith("tableextension_") || type.startsWith("enum_") || type.startsWith("enumextension_"));
}

function getSymbols(uri: Uri): string[] {
    const manifest = getManifest(uri);
    return manifest?.preprocessorSymbols || [];
}

async function isTableField(document: TextDocument, position: Position, context: NextIdContext): Promise<boolean | string> {
    return await ParserConnector.instance.checkField(document.getText(), position, getSymbols(document.uri), context);
}

async function isEnumValue(document: TextDocument, position: Position, context: NextIdContext): Promise<boolean | string> {
    return await ParserConnector.instance.checkValue(document.getText(), position, getSymbols(document.uri), context);
}

async function getTypeAtPositionRaw(document: TextDocument, position: Position, context: NextIdContext): Promise<string | null> {
    const matches: DocumentSymbol[] = [];
    const symbol = await getSymbolAtPosition(document.uri, position, matches);

    // Check for table fields
    if (matches.length > 1 && matches[0].name.toLowerCase().startsWith("table") && matches[1].name.toLowerCase() === "fields") {
        const objectParts = matches[0].name.toLowerCase().split(" ");
        const isField = await isTableField(document, position, context);
        if (!isField) {
            return null;
        }
        if (objectParts[1] !== "0") {
            if (isField === ";") {
                context.injectSemicolon = true;
            }
            return `${objectParts[0]}_${objectParts[1]}`;
        }
        return null;
    }

    // Check for enum values
    if (matches.length > 0 && matches[0].name.toLowerCase().startsWith("enum")) {
        const objectParts = matches[0].name.toLowerCase().split(" ");
        const isValue = await isEnumValue(document, position, context);
        if (isValue) {
            if (objectParts[1] !== "0") {
                if (isValue === ";") {
                    context.injectSemicolon = true;
                }
                return `${objectParts[0]}_${objectParts[1]}`;
            }
            return null;
        }
    }

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

async function getTypeAtPosition(document: TextDocument, position: Position, context: NextIdContext): Promise<string | null> {
    let type = await getTypeAtPositionRaw(document, position, context);
    if (type === null) return null;

    type = type.toLowerCase();
    return OBJECT_TYPES.includes(type) || isTableOrEnum(type) ? type : null;
}

function showNotificationsIfNecessary(manifest: AppManifest, objectId?: NextObjectIdInfo): boolean {
    if (!objectId) return true;

    if (!objectId.hasConsumption) {
        if (!syncDisabled[manifest.id] && !stopAsking) {
            syncIfChosen(manifest, UI.nextId.showNoBackEndConsumptionInfo(manifest.name));
        }
        return true;
    }

    if (!objectId.available) {
        syncIfChosen(manifest, UI.nextId.showNoMoreNumbersWarning());
        return true;
    }

    return false;
}

export class NextObjectIdCompletionProvider {
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        const nextIdContext: NextIdContext = { injectSemicolon: false };
        const type = await getTypeAtPosition(document, position, nextIdContext);
        if (!type) return;

        const manifest = getManifest(document.uri);
        if (!manifest) return;

        const { authKey } = ObjIdConfig.instance(document.uri);
        const objectId = await Backend.getNextNo(manifest.id, type, manifest.idRanges, false, authKey);
        Telemetry.instance.log("getNextNo-fetch", manifest.id);

        if (showNotificationsIfNecessary(manifest, objectId) || !objectId) return [];
        output.log(`Suggesting object ID auto-complete for ${type} ${objectId.id}`);

        if (Array.isArray(objectId.id)) {
            if (!objectId.id.length) {
                objectId.id.push(0);
            }

            const items: NextObjectIdCompletionItem[] = [];
            for (let id of objectId.id) {
                const objectIdCopy = { ...objectId, id };
                items.push(new NextObjectIdCompletionItem(type, objectIdCopy, manifest, position, document.uri, { ...nextIdContext, requireId: id }));
            }
            return items;
        } else {
            return [new NextObjectIdCompletionItem(type, objectId, manifest, position, document.uri, nextIdContext)];
        }
    }
}
