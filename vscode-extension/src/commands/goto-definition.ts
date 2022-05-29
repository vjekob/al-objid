import { commands, DocumentSymbol, Selection, Uri, window } from "vscode";
import { jsonAvailable } from "../features/linters/jsonAvailable";
import { GoToDefinitionCommandContext } from "../features/treeView/rangeExplorer/contexts/GoToDefinitionCommandContext";
import { Telemetry } from "../lib/Telemetry";
import { NinjaALRange } from "../lib/types/NinjaALRange";
import { CodeCommand } from "./commands";

export function goToDefinition(context: GoToDefinitionCommandContext<NinjaALRange>) {
    Telemetry.instance.log("goto-def", context.goto.app.hash, { file: context.goto.file, type: context.goto.type });

    switch (context.goto.file) {
        case "manifest":
            goToManifest(context);
            break;

        case "configuration":
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
        if (range.children.find(c => c.name === "description" && c.detail === name)) {
            result.push(range);
        }
    }
    return result;
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
        case "idRanges":
            editor.selection = new Selection(idRanges!.range.start, idRanges!.range.end);
            break;

        case "range":
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
    let logicalRanges: DocumentSymbol[] | undefined;

    switch (goto.type) {
        case "idRanges":
            idRanges = await getIdRanges(uri);
            selection = new Selection(idRanges!.range.start, idRanges!.range.end);
            break;

        case "objectRanges":
            const objectRanges = await getObjectRanges(uri);
            selection = new Selection(objectRanges!.range.start, objectRanges!.range.end);
            break;

        case "logicalName":
            logicalRanges = await getNamedLogicalRanges(uri, goto.logicalName!);
            if (!logicalRanges || logicalRanges.length === 0) {
                return;
            }
            for (let range of logicalRanges!) {
                selections.push(new Selection(range.range.start, range.range.end));
            }
            break;

        case "range":
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
    }

    if (!selection && selections.length === 0) {
        return;
    }

    const editor = await window.showTextDocument(uri);
    if (selection) {
        editor.selection = selection;
    } else {
        editor.selections = selections;
    }
}
