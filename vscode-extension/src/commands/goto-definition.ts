import { commands, DocumentSymbol, Range, Selection, Uri, window } from "vscode";
import { jsonAvailable } from "../features/linters/jsonAvailable";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "./contexts/GoToDefinitionCommandContext";
import { Telemetry } from "../lib/Telemetry";
import { NinjaALRange } from "../lib/types/NinjaALRange";
import { CodeCommand, NinjaCommand } from "./commands";

export function goToDefinition(context: GoToDefinitionCommandContext<NinjaALRange>) {
    Telemetry.instance.logAppCommand(context.goto.app, NinjaCommand.GoToDefinition, {
        file: context.goto.file,
        type: context.goto.type,
    });

    switch (context.goto.file) {
        case GoToDefinitionFile.Manifest:
            goToManifest(context);
            break;

        case GoToDefinitionFile.Configuration:
            goToConfiguration(context);
            break;
    }
}

async function getIdRanges(uri: Uri): Promise<DocumentSymbol | undefined> {
    await jsonAvailable;

    const symbols = await (commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, uri) as Promise<
        DocumentSymbol[] | undefined
    >);
    if (!symbols) {
        return;
    }
    return symbols.find(symbol => symbol.name === "idRanges");
}

async function getObjectRanges(uri: Uri): Promise<DocumentSymbol | undefined> {
    await jsonAvailable;

    const symbols = await (commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, uri) as Promise<
        DocumentSymbol[] | undefined
    >);
    if (!symbols) {
        return;
    }
    return symbols.find(symbol => symbol.name === "objectRanges");
}

async function getNamedLogicalRanges(uri: Uri, name: string): Promise<DocumentSymbol[] | undefined> {
    const idRanges = await getIdRanges(uri);
    if (!idRanges) {
        return;
    }
    const result: DocumentSymbol[] = [];
    for (let range of idRanges!.children) {
        if (
            range.children.find(c => c.name === "description" && c.detail === name) ||
            (!name && !range.children.find(c => c.name === "description"))
        ) {
            result.push(range);
        }
    }
    return result;
}

async function getObjectTypeRanges(uri: Uri, objectType: string): Promise<DocumentSymbol | undefined> {
    const objectRanges = await getObjectRanges(uri);
    return objectRanges?.children.find(r => r.name === objectType!);
}

async function goToManifest({ goto }: GoToDefinitionCommandContext<NinjaALRange>) {
    const { uri } = goto.app.manifest;
    const idRanges = await getIdRanges(uri);
    if (!idRanges) {
        return;
    }

    const editor = await window.showTextDocument(uri);

    const from = `${goto.range?.from}`;
    const to = `${goto.range?.to}`;

    switch (goto.type) {
        case GoToDefinitionType.IdRanges:
            editor.selection = new Selection(idRanges!.range.start, idRanges!.range.end);
            break;

        case GoToDefinitionType.Range:
            const range = idRanges.children.find(
                c =>
                    c.children.find(c => c.name === "from" && c.detail === from) &&
                    c.children.find(c => c.name === "to" && c.detail === to)
            );
            if (range) {
                editor.selection = new Selection(range.range.start, range.range.end);
            }
            break;
    }
}

async function goToConfiguration({ goto }: GoToDefinitionCommandContext<NinjaALRange>) {
    const { uri } = goto.app.config;
    const from = `${goto.range?.from}`;
    const to = `${goto.range?.to}`;

    let selection: Selection | undefined;
    let selections: Selection[] = [];
    let idRanges: DocumentSymbol | undefined;
    let objectRanges: DocumentSymbol | undefined;
    let objectTypeRanges: DocumentSymbol | undefined;
    let logicalRanges: DocumentSymbol[] | undefined;

    switch (goto.type) {
        case GoToDefinitionType.IdRanges:
            idRanges = await getIdRanges(uri);
            selection = new Selection(idRanges!.range.start, idRanges!.range.end);
            break;

        case GoToDefinitionType.ObjectRanges:
            objectRanges = await getObjectRanges(uri);
            selection = new Selection(objectRanges!.range.start, objectRanges!.range.end);
            break;

        case GoToDefinitionType.LogicalName:
            logicalRanges = await getNamedLogicalRanges(uri, goto.logicalName!);
            if (!logicalRanges || logicalRanges.length === 0) {
                return;
            }
            for (let range of logicalRanges!) {
                selections.push(new Selection(range.range.start, range.range.end));
            }
            break;

        case GoToDefinitionType.Range:
            logicalRanges = await getNamedLogicalRanges(uri, goto.range!.description);
            if (!logicalRanges || logicalRanges.length === 0) {
                return;
            }
            const range = logicalRanges.find(
                r =>
                    r.children.find(c => c.name === "from" && c.detail === from) &&
                    r.children.find(c => c.name === "to" && c.detail === to)
            );
            if (range) {
                selection = new Selection(range.range.start, range.range.end);
            }
            break;

        case GoToDefinitionType.ObjectType:
            objectTypeRanges = await getObjectTypeRanges(uri, goto.objectType!);
            if (objectTypeRanges) {
                selection = new Selection(objectTypeRanges.range.start, objectTypeRanges.range.end);
            }
            break;

        case GoToDefinitionType.ObjectTypeRanges:
            objectTypeRanges = await getObjectTypeRanges(uri, goto.objectType!);
            const logicalObjectTypeRanges = objectTypeRanges?.children.filter(c =>
                c.children.find(c => c.name === "description" && c.detail === goto.logicalName!)
            );
            if (!logicalObjectTypeRanges) {
                return;
            }
            for (let range of logicalObjectTypeRanges) {
                selections.push(new Selection(range.range.start, range.range.end));
            }
            break;

        case GoToDefinitionType.ObjectTypeRange:
            objectTypeRanges = await getObjectTypeRanges(uri, goto.objectType!);
            const logicalObjectTypeRange = objectTypeRanges?.children.find(
                c =>
                    c.children.find(c => c.name === "description" && c.detail === goto.range!.description) &&
                    c.children.find(c => c.name === "from" && c.detail === from) &&
                    c.children.find(c => c.name === "to" && c.detail === to)
            );
            if (logicalObjectTypeRange) {
                selection = new Selection(logicalObjectTypeRange.range.start, logicalObjectTypeRange.range.end);
            }
    }

    if (!selection && selections.length === 0) {
        return;
    }

    const editor = await window.showTextDocument(uri);
    if (selection) {
        editor.selection = selection;
        editor.revealRange(new Range(selection.start, selection.end));
    } else {
        editor.selections = selections;
        const firstSelection = selections.reduce(
            (previous, current) => (current.start.line < previous.start.line ? current : previous),
            selections[0]
        );
        const lastSelection = selections.reduce(
            (previous, current) => (current.end.line > previous.end.line ? current : previous),
            selections[0]
        );
        editor.revealRange(new Range(firstSelection.start, lastSelection.end));
    }
}
