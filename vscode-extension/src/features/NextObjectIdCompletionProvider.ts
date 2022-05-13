import {
    CancellationToken,
    commands,
    CompletionContext,
    DocumentSymbol,
    env,
    Position,
    TextDocument,
    Uri,
} from "vscode";
import { EOL } from "os";
import { NextObjectIdCompletionItem } from "./NextObjectIdCompletionItem";
import { LABELS, URLS } from "../lib/constants";
import { ALObjectType } from "../lib/types/ALObjectType";
import { Backend } from "../lib/backend/Backend";
import { UI } from "../lib/UI";
import { output } from "./Output";
import { NextObjectIdInfo } from "../lib/types/NextObjectIdInfo";
import { PropertyBag } from "../lib/types/PropertyBag";
import { Telemetry } from "../lib/Telemetry";
import { NextIdContext, ParserConnector } from "./ParserConnector";
import { getSymbolAtPosition } from "../lib/functions/getSymbolAtPosition";
import { getRangeForId } from "../lib/functions/getRangeForId";
import { ALApp } from "../lib/ALApp";
import { WorkspaceManager } from "./WorkspaceManager";

type SymbolInfo = {
    type: string;
    id: string;
    name: string;
};

let syncDisabled: PropertyBag<boolean> = {};
let syncSkipped = 0;
let stopAsking = false;

export async function syncIfChosen(app: ALApp, choice: Promise<string | undefined>) {
    switch (await choice) {
        case LABELS.BUTTON_SYNCHRONIZE:
            commands.executeCommand("vjeko-al-objid.sync-object-ids", {
                skipQuestion: true,
            });
            break;
        case LABELS.BUTTON_LEARN_MORE:
            Telemetry.instance.log("docs.learnExtension");
            env.openExternal(Uri.parse(URLS.EXTENSION_LEARN));
            break;
        default:
            syncDisabled[app.hash] = true;
            if (++syncSkipped > 1) {
                if ((await UI.nextId.showNoBackEndConsumptionInfoAlreadySaidNo()) === LABELS.BUTTON_DONT_ASK) {
                    stopAsking = true;
                }
            }
            break;
    }
}

function isTableOrEnum(type: string) {
    return (
        type.startsWith("table_") ||
        type.startsWith("tableextension_") ||
        type.startsWith("enum_") ||
        type.startsWith("enumextension_")
    );
}

// TODO Ninja does not properly suggest next object ID when inside conditional directive
/*
codeunit
#if test
50011       // here it will not suggest anything...
#else
50012       // ... nor here (but AL will, in both places)
#endif
*/
function getSymbols(uri: Uri): string[] {
    const app = WorkspaceManager.instance.getALAppFromUri(uri);
    return app?.manifest.preprocessorSymbols || [];
}

async function isTableField(
    document: TextDocument,
    position: Position,
    context: NextIdContext
): Promise<boolean | string> {
    return await ParserConnector.instance.checkField(document.getText(), position, getSymbols(document.uri), context);
}

async function isEnumValue(
    document: TextDocument,
    position: Position,
    context: NextIdContext
): Promise<boolean | string> {
    return await ParserConnector.instance.checkValue(document.getText(), position, getSymbols(document.uri), context);
}

async function getTypeAtPositionRaw(
    document: TextDocument,
    position: Position,
    context: NextIdContext
): Promise<string | null> {
    const matches: DocumentSymbol[] = [];
    const symbol = await getSymbolAtPosition(document.uri, position, matches);

    // Check for table fields
    if (
        matches.length > 1 &&
        matches[0].name.toLowerCase().startsWith("table") &&
        matches[1].name.toLowerCase() === "fields"
    ) {
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
    }

    const match = symbol.name.match(/^(?<type>\w+)\s(?<id>\d+)\s(?<name>"?.+"?)?$/);
    if (match) {
        const { type, id } = match.groups as SymbolInfo;
        if (id !== "0") return null;

        const pos = position.translate(
            -symbol.range.start.line,
            position.line === symbol.range.start.line ? -symbol.range.start.character : 0
        );
        const lines = document
            .getText(symbol.range)
            .split(EOL)
            .slice(0, pos.line + 1);
        lines[lines.length - 1] = lines[lines.length - 1].substring(0, pos.character);
        const text = lines.join("").trim();
        if (text.toLowerCase() === type.toLowerCase()) return type;
    }
    return null;
}

async function getTypeAtPosition(
    document: TextDocument,
    position: Position,
    context: NextIdContext
): Promise<string | null> {
    let type = await getTypeAtPositionRaw(document, position, context);
    if (type === null) return null;

    type = type.toLowerCase();
    return Object.values<string>(ALObjectType).includes(type) || isTableOrEnum(type) ? type : null;
}

function showNotificationsIfNecessary(app: ALApp, objectId?: NextObjectIdInfo): boolean {
    if (!objectId) return true;

    if (!objectId.hasConsumption) {
        if (!syncDisabled[app.hash] && !stopAsking) {
            syncIfChosen(app, UI.nextId.showNoBackEndConsumptionInfo(app));
        }
        return true;
    }

    if (!objectId.available) {
        syncIfChosen(app, UI.nextId.showNoMoreNumbersWarning());
        return true;
    }

    return false;
}

export class NextObjectIdCompletionProvider {
    async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ) {
        const nextIdContext: NextIdContext = { injectSemicolon: false };
        const type = await getTypeAtPosition(document, position, nextIdContext);
        if (!type) {
            return;
        }

        const app = WorkspaceManager.instance.getALAppFromUri(document.uri);
        if (!app) {
            return;
        }

        const objectId = await Backend.getNextNo(app, type, app.manifest.idRanges, false);
        Telemetry.instance.log("getNextNo-fetch", app.hash);

        if (showNotificationsIfNecessary(app, objectId) || !objectId) return [];
        output.log(`Suggesting object ID auto-complete for ${type} ${objectId.id}`);

        if (Array.isArray(objectId.id)) {
            if (!objectId.id.length) {
                objectId.id.push(0);
            }

            const items: NextObjectIdCompletionItem[] = [];
            const logicalNames: string[] = [];
            for (let i = 0; i < objectId.id.length; i++) {
                const id = objectId.id[i];
                const range = getRangeForId(id as number, app.config.getObjectTypeRanges(type));
                if (range && range.description) {
                    if (logicalNames.includes(range.description)) {
                        continue;
                    }
                    logicalNames.push(range.description);
                }
                const objectIdCopy = { ...objectId, id };
                const deeperContext = {
                    ...nextIdContext,
                    requireId: id,
                    additional: { ordinal: i },
                } as NextIdContext;
                items.push(
                    new NextObjectIdCompletionItem(
                        type,
                        objectIdCopy,
                        app,
                        position,
                        document.uri,
                        deeperContext,
                        range
                    )
                );
            }
            return items;
        } else {
            return [new NextObjectIdCompletionItem(type, objectId, app, position, document.uri, nextIdContext)];
        }
    }
}
