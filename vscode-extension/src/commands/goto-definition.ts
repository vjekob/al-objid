import { commands, DocumentSymbol, Selection, Uri, window } from "vscode";
import { jsonAvailable } from "../features/linters/jsonAvailable";
import { GoToDefinitionCommandContext } from "../features/treeView/rangeExplorer/contexts/GoToDefinitionCommandContext";
import { Telemetry } from "../lib/Telemetry";
import { CodeCommand } from "./commands";

export function goToDefinition(context: GoToDefinitionCommandContext) {
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

async function goToManifest({ goto }: GoToDefinitionCommandContext) {
    const { uri } = goto.app.manifest;
    const idRanges = await getIdRanges(uri);
    if (!idRanges) {
        return;
    }

    const editor = await window.showTextDocument(uri);

    switch (goto.type) {
        case "idRanges":
            editor.selection = new Selection(idRanges!.range.start, idRanges!.range.end);
            break;

        case "range":
            const { from, to } = goto.range!;
            const range = idRanges.children.find(
                c =>
                    c.children.find(c => c.name === "from" && c.detail == `${from}`) &&
                    c.children.find(c => c.name === "to" && c.detail == `${to}`)
            );
            if (range) {
                editor.selection = new Selection(range.range.start, range.range.end);
            }
            break;
    }
}

async function goToConfiguration({ goto }: GoToDefinitionCommandContext) {
    const { uri } = goto.app.config;

    let selection: Selection | undefined;
    let selections: Selection[] = [];
    let idRanges: DocumentSymbol | undefined;

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
            idRanges = await getIdRanges(uri);
            for (let range of idRanges!.children) {
                if (range.children.find(c => c.name === "description" && c.detail === goto.name)) {
                    selections.push(new Selection(range.range.start, range.range.end));
                }
            }
            break;
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
